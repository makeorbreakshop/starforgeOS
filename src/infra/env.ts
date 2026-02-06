import { createSubsystemLogger } from "../logging/subsystem.js";
import { parseBooleanValue } from "../utils/boolean.js";

const log = createSubsystemLogger("env");
const loggedEnv = new Set<string>();

type AcceptedEnvOption = {
  key: string;
  description: string;
  value?: string;
  redact?: boolean;
};

function formatEnvValue(value: string, redact?: boolean): string {
  if (redact) {
    return "<redacted>";
  }
  const singleLine = value.replace(/\s+/g, " ").trim();
  if (singleLine.length <= 160) {
    return singleLine;
  }
  return `${singleLine.slice(0, 160)}…`;
}

export function logAcceptedEnvOption(option: AcceptedEnvOption): void {
  if (process.env.VITEST || process.env.NODE_ENV === "test") {
    return;
  }
  if (loggedEnv.has(option.key)) {
    return;
  }
  const rawValue = option.value ?? process.env[option.key];
  if (!rawValue || !rawValue.trim()) {
    return;
  }
  loggedEnv.add(option.key);
  log.info(`env: ${option.key}=${formatEnvValue(rawValue, option.redact)} (${option.description})`);
}

export function normalizeZaiEnv(): void {
  if (!process.env.ZAI_API_KEY?.trim() && process.env.Z_AI_API_KEY?.trim()) {
    process.env.ZAI_API_KEY = process.env.Z_AI_API_KEY;
  }
}

/**
 * Map of deprecated OPENCLAW_* environment variables to their new STARFORGEOS_* equivalents.
 * Used for backwards compatibility.
 */
const DEPRECATED_ENV_VAR_MAP: Record<string, string> = {
  OPENCLAW_STATE_DIR: "STARFORGEOS_STATE_DIR",
  OPENCLAW_CONFIG_PATH: "STARFORGEOS_CONFIG_PATH",
  OPENCLAW_NIX_MODE: "STARFORGEOS_NIX_MODE",
  OPENCLAW_PREFER_PNPM: "STARFORGEOS_PREFER_PNPM",
  OPENCLAW_WORKSPACE_DIR: "STARFORGEOS_WORKSPACE_DIR",
  OPENCLAW_GATEWAY_TOKEN: "STARFORGEOS_GATEWAY_TOKEN",
  OPENCLAW_GATEWAY_PASSWORD: "STARFORGEOS_GATEWAY_PASSWORD",
  OPENCLAW_SKIP_CHANNELS: "STARFORGEOS_SKIP_CHANNELS",
  OPENCLAW_LAUNCHD_LABEL: "STARFORGEOS_LAUNCHD_LABEL",
  OPENCLAW_VERSION: "STARFORGEOS_VERSION",
  OPENCLAW_PROFILE: "STARFORGEOS_PROFILE",
  OPENCLAW_VERBOSE: "STARFORGEOS_VERBOSE",
  OPENCLAW_CONFIG_DIR: "STARFORGEOS_CONFIG_DIR",
  OPENCLAW_AGENT_DIR: "STARFORGEOS_AGENT_DIR",
  OPENCLAW_GATEWAY_PORT: "STARFORGEOS_GATEWAY_PORT",
  OPENCLAW_GATEWAY_BIND: "STARFORGEOS_GATEWAY_BIND",
  OPENCLAW_SYSTEMD_UNIT: "STARFORGEOS_SYSTEMD_UNIT",
};

const warnedDeprecations = new Set<string>();

/**
 * Migrate deprecated OPENCLAW_* environment variables to STARFORGEOS_*.
 * Shows a deprecation warning once per variable and automatically
 * sets the new variable if it's not already set.
 */
export function migrateDeprecatedEnvVars(): void {
  for (const [oldVar, newVar] of Object.entries(DEPRECATED_ENV_VAR_MAP)) {
    const oldValue = process.env[oldVar];
    const newValue = process.env[newVar];

    // If old variable is set and new one isn't, migrate it
    if (oldValue?.trim() && !newValue?.trim()) {
      process.env[newVar] = oldValue;

      // Show deprecation warning once
      if (
        !warnedDeprecations.has(oldVar) &&
        !process.env.VITEST &&
        process.env.NODE_ENV !== "test"
      ) {
        warnedDeprecations.add(oldVar);
        log.warn(`env: ${oldVar} is deprecated, please use ${newVar} instead`);
      }
    }
  }
}

export function isTruthyEnvValue(value?: string): boolean {
  return parseBooleanValue(value) === true;
}

export function normalizeEnv(): void {
  normalizeZaiEnv();
  migrateDeprecatedEnvVars();
}
