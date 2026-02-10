import { describe, expect, it } from "vitest";
import { parseSessionLabel, SESSION_LABEL_MAX_LENGTH } from "./session-label.js";

describe("parseSessionLabel", () => {
  it("rejects non-strings", () => {
    expect(parseSessionLabel(null)).toEqual({
      ok: false,
      error: "invalid label: must be a string",
    });
    expect(parseSessionLabel(123)).toEqual({ ok: false, error: "invalid label: must be a string" });
  });

  it("rejects empty/whitespace", () => {
    expect(parseSessionLabel("")).toEqual({ ok: false, error: "invalid label: empty" });
    expect(parseSessionLabel("   ")).toEqual({ ok: false, error: "invalid label: empty" });
  });

  it("rejects overly long labels", () => {
    const tooLong = "a".repeat(SESSION_LABEL_MAX_LENGTH + 1);
    expect(parseSessionLabel(tooLong)).toEqual({
      ok: false,
      error: `invalid label: too long (max ${SESSION_LABEL_MAX_LENGTH})`,
    });
  });

  it("trims and accepts valid labels", () => {
    expect(parseSessionLabel("  hello  ")).toEqual({ ok: true, label: "hello" });
  });
});
