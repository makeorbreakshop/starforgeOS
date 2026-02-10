import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function ensureTrailingNewline(raw: string): string {
  return raw.endsWith("\n") ? raw : `${raw}\n`;
}

const extensionsDir = path.resolve("extensions");
const entries = readdirSync(extensionsDir, { withFileTypes: true }).filter((entry) =>
  entry.isDirectory(),
);

const updated: string[] = [];
const created: string[] = [];
const skipped: string[] = [];

for (const dir of entries) {
  const root = path.join(extensionsDir, dir.name);
  const openclawManifestPath = path.join(root, "openclaw.plugin.json");
  const starforgeManifestPath = path.join(root, "starforge.plugin.json");

  if (!existsSync(openclawManifestPath)) {
    skipped.push(dir.name);
    continue;
  }

  // Keep the Starforge manifest byte-for-byte aligned with the OpenClaw manifest.
  // This avoids format churn (oxfmt) and keeps merges simple.
  const next = ensureTrailingNewline(readFileSync(openclawManifestPath, "utf8"));

  if (!existsSync(starforgeManifestPath)) {
    writeFileSync(starforgeManifestPath, next);
    created.push(dir.name);
    continue;
  }

  const prev = readFileSync(starforgeManifestPath, "utf8");
  if (prev !== next) {
    writeFileSync(starforgeManifestPath, next);
    updated.push(dir.name);
  } else {
    skipped.push(dir.name);
  }
}

console.log(
  `Synced plugin manifests. Created: ${created.length}. Updated: ${updated.length}. Skipped: ${skipped.length}.`,
);
