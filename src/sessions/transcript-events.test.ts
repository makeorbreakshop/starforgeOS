import { describe, expect, it } from "vitest";
import { emitSessionTranscriptUpdate, onSessionTranscriptUpdate } from "./transcript-events.js";

describe("session transcript events", () => {
  it("notifies listeners and trims the sessionFile", () => {
    const seen: string[] = [];
    const off = onSessionTranscriptUpdate((update) => {
      seen.push(update.sessionFile);
    });
    try {
      emitSessionTranscriptUpdate("  /tmp/sess.jsonl  ");
      expect(seen).toEqual(["/tmp/sess.jsonl"]);
    } finally {
      off();
    }
  });

  it("ignores empty sessionFile values", () => {
    const seen: string[] = [];
    const off = onSessionTranscriptUpdate((update) => {
      seen.push(update.sessionFile);
    });
    try {
      emitSessionTranscriptUpdate("");
      emitSessionTranscriptUpdate("   ");
      expect(seen).toEqual([]);
    } finally {
      off();
    }
  });

  it("supports unsubscribe", () => {
    const seen: string[] = [];
    const off = onSessionTranscriptUpdate((update) => {
      seen.push(update.sessionFile);
    });

    emitSessionTranscriptUpdate("/tmp/one.jsonl");
    off();
    emitSessionTranscriptUpdate("/tmp/two.jsonl");

    expect(seen).toEqual(["/tmp/one.jsonl"]);
  });
});
