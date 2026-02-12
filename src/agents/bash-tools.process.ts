import type { AgentTool } from "@mariozechner/pi-agent-core";
import { Type } from "@sinclair/typebox";
import { formatDurationCompact } from "../infra/format-time/format-duration.ts";
import {
  deleteSession,
  drainSession,
  getFinishedSession,
  getSession,
  listFinishedSessions,
  listRunningSessions,
  markExited,
  setJobTtlMs,
} from "./bash-process-registry.js";
import {
  clampWithDefault,
  deriveSessionName,
  killSession,
  pad,
  readEnvInt,
  sliceLogLines,
  truncateMiddle,
} from "./bash-tools.shared.js";
import { encodeKeySequence, encodePaste } from "./pty-keys.js";

export type ProcessToolDefaults = {
  cleanupMs?: number;
  scopeKey?: string;
};

const DEFAULT_LOG_LIMIT_LINES = clampWithDefault(
  readEnvInt("OPENCLAW_PROCESS_LOG_DEFAULT_LINES"),
  120,
  10,
  2000,
);
const DEFAULT_RESULT_MAX_CHARS = clampWithDefault(
  readEnvInt("OPENCLAW_PROCESS_RESULT_MAX_CHARS"),
  4000,
  500,
  32_000,
);

function truncateProcessText(text: string, maxChars = DEFAULT_RESULT_MAX_CHARS) {
  const originalChars = text.length;
  if (originalChars <= maxChars) {
    return { text, truncated: false, originalChars };
  }

  // Keep a stable head/tail preview to avoid injecting huge process buffers into session context.
  const reserveForNote = 160;
  const available = Math.max(maxChars - reserveForNote, 200);
  const headChars = Math.max(50, Math.floor(available / 2));
  const tailChars = Math.max(50, available - headChars);
  const head = text.slice(0, headChars);
  const tail = text.slice(Math.max(0, originalChars - tailChars));
  const note = `\n\n[process output truncated: ${originalChars} chars total]`;
  return { text: `${head}\n...\n${tail}${note}`, truncated: true, originalChars };
}

const processSchema = Type.Object({
  action: Type.String({ description: "Process action" }),
  sessionId: Type.Optional(Type.String({ description: "Session id for actions other than list" })),
  data: Type.Optional(Type.String({ description: "Data to write for write" })),
  keys: Type.Optional(
    Type.Array(Type.String(), { description: "Key tokens to send for send-keys" }),
  ),
  hex: Type.Optional(Type.Array(Type.String(), { description: "Hex bytes to send for send-keys" })),
  literal: Type.Optional(Type.String({ description: "Literal string for send-keys" })),
  text: Type.Optional(Type.String({ description: "Text to paste for paste" })),
  bracketed: Type.Optional(Type.Boolean({ description: "Wrap paste in bracketed mode" })),
  eof: Type.Optional(Type.Boolean({ description: "Close stdin after write" })),
  offset: Type.Optional(Type.Number({ description: "Log offset" })),
  limit: Type.Optional(Type.Number({ description: "Log length" })),
});

export function createProcessTool(
  defaults?: ProcessToolDefaults,
  // oxlint-disable-next-line typescript/no-explicit-any
): AgentTool<any> {
  if (defaults?.cleanupMs !== undefined) {
    setJobTtlMs(defaults.cleanupMs);
  }
  const scopeKey = defaults?.scopeKey;
  const isInScope = (session?: { scopeKey?: string } | null) =>
    !scopeKey || session?.scopeKey === scopeKey;

  return {
    name: "process",
    label: "process",
    description:
      "Manage running exec sessions: list, poll, log, write, send-keys, submit, paste, kill.",
    parameters: processSchema,
    execute: async (_toolCallId, args) => {
      const params = args as {
        action:
          | "list"
          | "poll"
          | "log"
          | "write"
          | "send-keys"
          | "submit"
          | "paste"
          | "kill"
          | "clear"
          | "remove";
        sessionId?: string;
        data?: string;
        keys?: string[];
        hex?: string[];
        literal?: string;
        text?: string;
        bracketed?: boolean;
        eof?: boolean;
        offset?: number;
        limit?: number;
      };

      if (params.action === "list") {
        const running = listRunningSessions()
          .filter((s) => isInScope(s))
          .map((s) => ({
            sessionId: s.id,
            status: "running",
            pid: s.pid ?? undefined,
            startedAt: s.startedAt,
            runtimeMs: Date.now() - s.startedAt,
            cwd: s.cwd,
            command: s.command,
            name: deriveSessionName(s.command),
            tail: s.tail,
            truncated: s.truncated,
          }));
        const finished = listFinishedSessions()
          .filter((s) => isInScope(s))
          .map((s) => ({
            sessionId: s.id,
            status: s.status,
            startedAt: s.startedAt,
            endedAt: s.endedAt,
            runtimeMs: s.endedAt - s.startedAt,
            cwd: s.cwd,
            command: s.command,
            name: deriveSessionName(s.command),
            tail: s.tail,
            truncated: s.truncated,
            exitCode: s.exitCode ?? undefined,
            exitSignal: s.exitSignal ?? undefined,
          }));
        const lines = [...running, ...finished]
          .toSorted((a, b) => b.startedAt - a.startedAt)
          .map((s) => {
            const label = s.name ? truncateMiddle(s.name, 80) : truncateMiddle(s.command, 120);
            return `${s.sessionId} ${pad(s.status, 9)} ${formatDurationCompact(s.runtimeMs) ?? "n/a"} :: ${label}`;
          });
        return {
          content: [
            {
              type: "text",
              text: lines.join("\n") || "No running or recent sessions.",
            },
          ],
          details: { status: "completed", sessions: [...running, ...finished] },
        };
      }

      if (!params.sessionId) {
        return {
          content: [{ type: "text", text: "sessionId is required for this action." }],
          details: { status: "failed" },
        };
      }

      const session = getSession(params.sessionId);
      const finished = getFinishedSession(params.sessionId);
      const scopedSession = isInScope(session) ? session : undefined;
      const scopedFinished = isInScope(finished) ? finished : undefined;

      switch (params.action) {
        case "poll": {
          if (!scopedSession) {
            if (scopedFinished) {
              const aggregatedPreview = truncateProcessText(scopedFinished.aggregated);
              return {
                content: [
                  {
                    type: "text",
                    text:
                      (scopedFinished.tail ||
                        `(no output recorded${
                          scopedFinished.truncated ? " — truncated to cap" : ""
                        })`) +
                      `\n\nProcess exited with ${
                        scopedFinished.exitSignal
                          ? `signal ${scopedFinished.exitSignal}`
                          : `code ${scopedFinished.exitCode ?? 0}`
                      }.`,
                  },
                ],
                details: {
                  status: scopedFinished.status === "completed" ? "completed" : "failed",
                  sessionId: params.sessionId,
                  exitCode: scopedFinished.exitCode ?? undefined,
                  aggregated: aggregatedPreview.text,
                  aggregatedChars: scopedFinished.aggregated.length,
                  aggregatedTruncated: aggregatedPreview.truncated,
                  name: deriveSessionName(scopedFinished.command),
                },
              };
            }
            return {
              content: [
                {
                  type: "text",
                  text: `No session found for ${params.sessionId}`,
                },
              ],
              details: { status: "failed" },
            };
          }
          if (!scopedSession.backgrounded) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} is not backgrounded.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          const { stdout, stderr } = drainSession(scopedSession);
          const exited = scopedSession.exited;
          const exitCode = scopedSession.exitCode ?? 0;
          const exitSignal = scopedSession.exitSignal ?? undefined;
          if (exited) {
            const status = exitCode === 0 && exitSignal == null ? "completed" : "failed";
            markExited(
              scopedSession,
              scopedSession.exitCode ?? null,
              scopedSession.exitSignal ?? null,
              status,
            );
          }
          const status = exited
            ? exitCode === 0 && exitSignal == null
              ? "completed"
              : "failed"
            : "running";
          const output = [stdout.trimEnd(), stderr.trimEnd()].filter(Boolean).join("\n").trim();
          const aggregatedPreview = truncateProcessText(scopedSession.aggregated);
          return {
            content: [
              {
                type: "text",
                text:
                  (output || "(no new output)") +
                  (exited
                    ? `\n\nProcess exited with ${
                        exitSignal ? `signal ${exitSignal}` : `code ${exitCode}`
                      }.`
                    : "\n\nProcess still running."),
              },
            ],
            details: {
              status,
              sessionId: params.sessionId,
              exitCode: exited ? exitCode : undefined,
              aggregated: aggregatedPreview.text,
              aggregatedChars: scopedSession.aggregated.length,
              aggregatedTruncated: aggregatedPreview.truncated,
              name: deriveSessionName(scopedSession.command),
            },
          };
        }

        case "log": {
          if (scopedSession) {
            if (!scopedSession.backgrounded) {
              return {
                content: [
                  {
                    type: "text",
                    text: `Session ${params.sessionId} is not backgrounded.`,
                  },
                ],
                details: { status: "failed" },
              };
            }
            const { slice, totalLines, totalChars } = sliceLogLines(
              scopedSession.aggregated,
              params.offset,
              params.limit ?? DEFAULT_LOG_LIMIT_LINES,
            );
            const preview = truncateProcessText(slice || "(no output yet)");
            return {
              content: [{ type: "text", text: preview.text }],
              details: {
                status: scopedSession.exited ? "completed" : "running",
                sessionId: params.sessionId,
                total: totalLines,
                totalLines,
                totalChars,
                returnedChars: preview.text.length,
                outputTruncated: preview.truncated,
                truncated: scopedSession.truncated,
                name: deriveSessionName(scopedSession.command),
              },
            };
          }
          if (scopedFinished) {
            const { slice, totalLines, totalChars } = sliceLogLines(
              scopedFinished.aggregated,
              params.offset,
              params.limit ?? DEFAULT_LOG_LIMIT_LINES,
            );
            const status = scopedFinished.status === "completed" ? "completed" : "failed";
            const preview = truncateProcessText(slice || "(no output recorded)");
            return {
              content: [{ type: "text", text: preview.text }],
              details: {
                status,
                sessionId: params.sessionId,
                total: totalLines,
                totalLines,
                totalChars,
                returnedChars: preview.text.length,
                outputTruncated: preview.truncated,
                truncated: scopedFinished.truncated,
                exitCode: scopedFinished.exitCode ?? undefined,
                exitSignal: scopedFinished.exitSignal ?? undefined,
                name: deriveSessionName(scopedFinished.command),
              },
            };
          }
          return {
            content: [
              {
                type: "text",
                text: `No session found for ${params.sessionId}`,
              },
            ],
            details: { status: "failed" },
          };
        }

        case "write": {
          if (!scopedSession) {
            return {
              content: [
                {
                  type: "text",
                  text: `No active session found for ${params.sessionId}`,
                },
              ],
              details: { status: "failed" },
            };
          }
          if (!scopedSession.backgrounded) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} is not backgrounded.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          const stdin = scopedSession.stdin ?? scopedSession.child?.stdin;
          if (!stdin || stdin.destroyed) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} stdin is not writable.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          await new Promise<void>((resolve, reject) => {
            stdin.write(params.data ?? "", (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
          if (params.eof) {
            stdin.end();
          }
          return {
            content: [
              {
                type: "text",
                text: `Wrote ${(params.data ?? "").length} bytes to session ${params.sessionId}${
                  params.eof ? " (stdin closed)" : ""
                }.`,
              },
            ],
            details: {
              status: "running",
              sessionId: params.sessionId,
              name: scopedSession ? deriveSessionName(scopedSession.command) : undefined,
            },
          };
        }

        case "send-keys": {
          if (!scopedSession) {
            return {
              content: [
                {
                  type: "text",
                  text: `No active session found for ${params.sessionId}`,
                },
              ],
              details: { status: "failed" },
            };
          }
          if (!scopedSession.backgrounded) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} is not backgrounded.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          const stdin = scopedSession.stdin ?? scopedSession.child?.stdin;
          if (!stdin || stdin.destroyed) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} stdin is not writable.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          const { data, warnings } = encodeKeySequence({
            keys: params.keys,
            hex: params.hex,
            literal: params.literal,
          });
          if (!data) {
            return {
              content: [
                {
                  type: "text",
                  text: "No key data provided.",
                },
              ],
              details: { status: "failed" },
            };
          }
          await new Promise<void>((resolve, reject) => {
            stdin.write(data, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
          return {
            content: [
              {
                type: "text",
                text:
                  `Sent ${data.length} bytes to session ${params.sessionId}.` +
                  (warnings.length ? `\nWarnings:\n- ${warnings.join("\n- ")}` : ""),
              },
            ],
            details: {
              status: "running",
              sessionId: params.sessionId,
              name: scopedSession ? deriveSessionName(scopedSession.command) : undefined,
            },
          };
        }

        case "submit": {
          if (!scopedSession) {
            return {
              content: [
                {
                  type: "text",
                  text: `No active session found for ${params.sessionId}`,
                },
              ],
              details: { status: "failed" },
            };
          }
          if (!scopedSession.backgrounded) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} is not backgrounded.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          const stdin = scopedSession.stdin ?? scopedSession.child?.stdin;
          if (!stdin || stdin.destroyed) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} stdin is not writable.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          await new Promise<void>((resolve, reject) => {
            stdin.write("\r", (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
          return {
            content: [
              {
                type: "text",
                text: `Submitted session ${params.sessionId} (sent CR).`,
              },
            ],
            details: {
              status: "running",
              sessionId: params.sessionId,
              name: scopedSession ? deriveSessionName(scopedSession.command) : undefined,
            },
          };
        }

        case "paste": {
          if (!scopedSession) {
            return {
              content: [
                {
                  type: "text",
                  text: `No active session found for ${params.sessionId}`,
                },
              ],
              details: { status: "failed" },
            };
          }
          if (!scopedSession.backgrounded) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} is not backgrounded.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          const stdin = scopedSession.stdin ?? scopedSession.child?.stdin;
          if (!stdin || stdin.destroyed) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} stdin is not writable.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          const payload = encodePaste(params.text ?? "", params.bracketed !== false);
          if (!payload) {
            return {
              content: [
                {
                  type: "text",
                  text: "No paste text provided.",
                },
              ],
              details: { status: "failed" },
            };
          }
          await new Promise<void>((resolve, reject) => {
            stdin.write(payload, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
          return {
            content: [
              {
                type: "text",
                text: `Pasted ${params.text?.length ?? 0} chars to session ${params.sessionId}.`,
              },
            ],
            details: {
              status: "running",
              sessionId: params.sessionId,
              name: scopedSession ? deriveSessionName(scopedSession.command) : undefined,
            },
          };
        }

        case "kill": {
          if (!scopedSession) {
            return {
              content: [
                {
                  type: "text",
                  text: `No active session found for ${params.sessionId}`,
                },
              ],
              details: { status: "failed" },
            };
          }
          if (!scopedSession.backgrounded) {
            return {
              content: [
                {
                  type: "text",
                  text: `Session ${params.sessionId} is not backgrounded.`,
                },
              ],
              details: { status: "failed" },
            };
          }
          killSession(scopedSession);
          markExited(scopedSession, null, "SIGKILL", "failed");
          return {
            content: [{ type: "text", text: `Killed session ${params.sessionId}.` }],
            details: {
              status: "failed",
              name: scopedSession ? deriveSessionName(scopedSession.command) : undefined,
            },
          };
        }

        case "clear": {
          if (scopedFinished) {
            deleteSession(params.sessionId);
            return {
              content: [{ type: "text", text: `Cleared session ${params.sessionId}.` }],
              details: { status: "completed" },
            };
          }
          return {
            content: [
              {
                type: "text",
                text: `No finished session found for ${params.sessionId}`,
              },
            ],
            details: { status: "failed" },
          };
        }

        case "remove": {
          if (scopedSession) {
            killSession(scopedSession);
            markExited(scopedSession, null, "SIGKILL", "failed");
            return {
              content: [{ type: "text", text: `Removed session ${params.sessionId}.` }],
              details: {
                status: "failed",
                name: scopedSession ? deriveSessionName(scopedSession.command) : undefined,
              },
            };
          }
          if (scopedFinished) {
            deleteSession(params.sessionId);
            return {
              content: [{ type: "text", text: `Removed session ${params.sessionId}.` }],
              details: { status: "completed" },
            };
          }
          return {
            content: [
              {
                type: "text",
                text: `No session found for ${params.sessionId}`,
              },
            ],
            details: { status: "failed" },
          };
        }
      }

      return {
        content: [{ type: "text", text: `Unknown action ${params.action as string}` }],
        details: { status: "failed" },
      };
    },
  };
}

export const processTool = createProcessTool();
