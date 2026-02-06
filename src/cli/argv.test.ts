import { describe, expect, it } from "vitest";
import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "starforge", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "starforge", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "starforge", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "starforge", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "starforge", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "starforge", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "starforge", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "starforge"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "starforge", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "starforge", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "starforge", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "starforge", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "starforge", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "starforge", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "starforge", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "starforge", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "starforge", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "starforge", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "starforge", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "starforge", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "starforge", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "starforge", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["node", "starforge", "status"],
    });
    expect(nodeArgv).toEqual(["node", "starforge", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["node-22", "starforge", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "starforge", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["node-22.2.0.exe", "starforge", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "starforge", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["node-22.2", "starforge", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "starforge", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["node-22.2.exe", "starforge", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "starforge", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["/usr/bin/node-22.2.0", "starforge", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "starforge", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["nodejs", "starforge", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "starforge", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["node-dev", "starforge", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "starforge", "node-dev", "starforge", "status"]);

    const directArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["starforge", "status"],
    });
    expect(directArgv).toEqual(["node", "starforge", "status"]);

    const bunArgv = buildParseArgv({
      programName: "starforge",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "starforge",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "starforge", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "starforge", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "starforge", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "starforge", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "starforge", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "starforge", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "starforge", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "starforge", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
