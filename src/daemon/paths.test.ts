import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".starforge"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", STARFORGEOS_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".starforge-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", STARFORGEOS_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".starforge"));
  });

  it("uses STARFORGEOS_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", STARFORGEOS_STATE_DIR: "/var/lib/starforge" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/starforge"));
  });

  it("expands ~ in STARFORGEOS_STATE_DIR", () => {
    const env = { HOME: "/Users/test", STARFORGEOS_STATE_DIR: "~/starforge-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/starforge-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { STARFORGEOS_STATE_DIR: "C:\\State\\starforge" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\starforge");
  });
});
