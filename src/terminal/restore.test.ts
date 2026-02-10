import { describe, expect, it, vi } from "vitest";

// restore.ts imports clearActiveProgressLine at module load; mock before importing.
vi.mock("./progress-line.js", () => ({
  clearActiveProgressLine: vi.fn(),
}));

describe("restoreTerminalState", () => {
  it("restores stdout + raw mode (best-effort) and reports failures", async () => {
    const { restoreTerminalState } = await import("./restore.js");

    const stderrWrite = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    const stdoutWrite = vi.spyOn(process.stdout, "write").mockImplementation(() => {
      throw new Error("stdout broken");
    });

    const stdin = process.stdin as unknown as {
      isTTY?: boolean;
      setRawMode?: (raw: boolean) => void;
      isPaused?: () => boolean;
      resume?: () => void;
    };

    const prevStdoutIsTTY = process.stdout.isTTY;
    const prevStdinIsTTY = stdin.isTTY;
    const prevSetRawMode = stdin.setRawMode;
    const prevIsPaused = stdin.isPaused;
    const prevResume = stdin.resume;

    try {
      Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
      stdin.isTTY = true;
      stdin.setRawMode = () => {
        throw new Error("raw mode broken");
      };
      stdin.isPaused = () => true;
      stdin.resume = () => {
        throw new Error("resume broken");
      };

      restoreTerminalState("test");

      const report = stderrWrite.mock.calls.map(([arg]) => String(arg)).join("");
      expect(report).toContain("[terminal] restore raw mode failed");
      expect(report).toContain("[terminal] restore stdin resume failed");
      expect(report).toContain("[terminal] restore stdout reset failed");
    } finally {
      stderrWrite.mockRestore();
      stdoutWrite.mockRestore();

      Object.defineProperty(process.stdout, "isTTY", {
        value: prevStdoutIsTTY,
        configurable: true,
      });
      stdin.isTTY = prevStdinIsTTY;
      stdin.setRawMode = prevSetRawMode;
      stdin.isPaused = prevIsPaused;
      stdin.resume = prevResume;
    }
  });
});
