import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "starforge",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "starforge", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "starforge", "--dev", "gateway"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "starforge", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "starforge", "--profile", "work", "status"]);
    if (!res.ok) {
      throw new Error(res.error);
    }
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "starforge", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "starforge", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (dev first)", () => {
    const res = parseCliProfileArgs(["node", "starforge", "--dev", "--profile", "work", "status"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (profile first)", () => {
    const res = parseCliProfileArgs(["node", "starforge", "--profile", "work", "--dev", "status"]);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join("/home/peter", ".starforge-dev");
    expect(env.STARFORGEOS_PROFILE).toBe("dev");
    expect(env.STARFORGEOS_STATE_DIR).toBe(expectedStateDir);
    expect(env.STARFORGEOS_CONFIG_PATH).toBe(path.join(expectedStateDir, "starforge.json"));
    expect(env.STARFORGEOS_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      STARFORGEOS_STATE_DIR: "/custom",
      STARFORGEOS_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.STARFORGEOS_STATE_DIR).toBe("/custom");
    expect(env.STARFORGEOS_GATEWAY_PORT).toBe("19099");
    expect(env.STARFORGEOS_CONFIG_PATH).toBe(path.join("/custom", "starforge.json"));
  });
});

describe("formatCliCommand", () => {
  it("returns command unchanged when no profile is set", () => {
    expect(formatCliCommand("starforge doctor --fix", {})).toBe("starforge doctor --fix");
  });

  it("returns command unchanged when profile is default", () => {
    expect(formatCliCommand("starforge doctor --fix", { STARFORGEOS_PROFILE: "default" })).toBe(
      "starforge doctor --fix",
    );
  });

  it("returns command unchanged when profile is Default (case-insensitive)", () => {
    expect(formatCliCommand("starforge doctor --fix", { STARFORGEOS_PROFILE: "Default" })).toBe(
      "starforge doctor --fix",
    );
  });

  it("returns command unchanged when profile is invalid", () => {
    expect(formatCliCommand("starforge doctor --fix", { STARFORGEOS_PROFILE: "bad profile" })).toBe(
      "starforge doctor --fix",
    );
  });

  it("returns command unchanged when --profile is already present", () => {
    expect(
      formatCliCommand("starforge --profile work doctor --fix", { STARFORGEOS_PROFILE: "work" }),
    ).toBe("starforge --profile work doctor --fix");
  });

  it("returns command unchanged when --dev is already present", () => {
    expect(formatCliCommand("starforge --dev doctor", { STARFORGEOS_PROFILE: "dev" })).toBe(
      "starforge --dev doctor",
    );
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("starforge doctor --fix", { STARFORGEOS_PROFILE: "work" })).toBe(
      "starforge --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(
      formatCliCommand("starforge doctor --fix", { STARFORGEOS_PROFILE: "  jbstarforge  " }),
    ).toBe("starforge --profile jbstarforge doctor --fix");
  });

  it("handles command with no args after starforge", () => {
    expect(formatCliCommand("starforge", { STARFORGEOS_PROFILE: "test" })).toBe(
      "starforge --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm starforge doctor", { STARFORGEOS_PROFILE: "work" })).toBe(
      "pnpm starforge --profile work doctor",
    );
  });
});
