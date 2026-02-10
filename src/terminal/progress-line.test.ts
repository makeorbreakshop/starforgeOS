import { describe, expect, it } from "vitest";
import {
  clearActiveProgressLine,
  registerActiveProgressLine,
  unregisterActiveProgressLine,
} from "./progress-line.js";

describe("progress line helpers", () => {
  it("does nothing for non-TTY streams", () => {
    const writes: string[] = [];
    const stream = {
      isTTY: false,
      write: (chunk: string) => {
        writes.push(chunk);
      },
    } as unknown as NodeJS.WriteStream;

    registerActiveProgressLine(stream);
    clearActiveProgressLine();
    unregisterActiveProgressLine(stream);

    expect(writes).toEqual([]);
  });

  it("clears the active progress line for TTY streams", () => {
    const writes: string[] = [];
    const stream = {
      isTTY: true,
      write: (chunk: string) => {
        writes.push(chunk);
      },
    } as unknown as NodeJS.WriteStream;

    registerActiveProgressLine(stream);
    clearActiveProgressLine();
    unregisterActiveProgressLine(stream);

    expect(writes).toEqual(["\r\x1b[2K"]);
  });

  it("unregister ignores mismatched streams", () => {
    const writes: string[] = [];
    const streamA = {
      isTTY: true,
      write: (c: string) => writes.push(`a:${c}`),
    } as unknown as NodeJS.WriteStream;
    const streamB = {
      isTTY: true,
      write: (c: string) => writes.push(`b:${c}`),
    } as unknown as NodeJS.WriteStream;

    registerActiveProgressLine(streamA);
    unregisterActiveProgressLine(streamB);
    clearActiveProgressLine();
    unregisterActiveProgressLine(streamA);

    expect(writes).toEqual(["a:\r\x1b[2K"]);
  });
});
