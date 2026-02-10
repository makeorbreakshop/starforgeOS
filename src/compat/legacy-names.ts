export const PROJECT_NAME = "starforge" as const;

// Accept upstream naming in metadata so forks can merge without churn.
export const LEGACY_PROJECT_NAMES = ["openclaw", "starforgeos"] as const;

export const MANIFEST_KEY = PROJECT_NAME;

export const LEGACY_MANIFEST_KEYS = LEGACY_PROJECT_NAMES;

// Plugin manifests historically used different filenames across rebrands/forks.
export const LEGACY_PLUGIN_MANIFEST_FILENAMES = [
  "openclaw.plugin.json",
  "starforgeos.plugin.json",
] as const;

export const LEGACY_CANVAS_HANDLER_NAMES = [] as const;

export const MACOS_APP_SOURCES_DIR = "apps/macos/Sources/StarforgeOS" as const;

export const LEGACY_MACOS_APP_SOURCES_DIRS = [] as const;
