import { describe, expect, it, vi } from "vitest";
import { formatRelativeTime } from "./time-format.js";

describe("formatRelativeTime", () => {
  it("formats recent timestamps as 'just now'", () => {
    vi.setSystemTime(new Date("2026-02-06T20:00:00Z"));
    expect(formatRelativeTime(Date.now() - 1_000)).toBe("just now");
    vi.useRealTimers();
  });

  it("formats minutes/hours/days", () => {
    vi.setSystemTime(new Date("2026-02-06T20:00:00Z"));

    expect(formatRelativeTime(Date.now() - 2 * 60_000)).toBe("2m ago");
    expect(formatRelativeTime(Date.now() - 3 * 60 * 60_000)).toBe("3h ago");
    expect(formatRelativeTime(Date.now() - 1 * 24 * 60 * 60_000)).toBe("Yesterday");
    expect(formatRelativeTime(Date.now() - 6 * 24 * 60 * 60_000)).toBe("6d ago");

    vi.useRealTimers();
  });

  it("falls back to a locale date string for older timestamps", () => {
    vi.setSystemTime(new Date("2026-02-06T20:00:00Z"));
    const out = formatRelativeTime(Date.now() - 30 * 24 * 60 * 60_000);
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });
});
