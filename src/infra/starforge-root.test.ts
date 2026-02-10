import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import {
  resetWorkspaceTemplateDirCache,
  resolveWorkspaceTemplateDir,
} from "../agents/workspace-templates.js";
import { resolveOpenClawPackageRoot } from "./starforge-root.js";

describe("resolveOpenClawPackageRoot", () => {
  it("resolves a starforgeos package root from moduleUrl", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "starforge-root-"));
    try {
      const pkgRoot = path.join(tmp, "node_modules", "starforgeos");
      await fs.mkdir(path.join(pkgRoot, "dist"), { recursive: true });
      await fs.writeFile(
        path.join(pkgRoot, "package.json"),
        JSON.stringify({ name: "starforgeos" }),
      );

      const moduleUrl = pathToFileURL(path.join(pkgRoot, "dist", "chunk.js")).href;
      await expect(resolveOpenClawPackageRoot({ moduleUrl })).resolves.toBe(pkgRoot);
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });

  it("resolves a starforge package root from argv1/.bin heuristics", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "starforge-root-"));
    try {
      const binDir = path.join(tmp, "node_modules", ".bin");
      const pkgRoot = path.join(tmp, "node_modules", "starforge");
      await fs.mkdir(binDir, { recursive: true });
      await fs.mkdir(pkgRoot, { recursive: true });
      await fs.writeFile(path.join(binDir, "starforge"), "#!/usr/bin/env node\n");
      await fs.writeFile(path.join(pkgRoot, "package.json"), JSON.stringify({ name: "starforge" }));

      await expect(
        resolveOpenClawPackageRoot({ argv1: path.join(binDir, "starforge") }),
      ).resolves.toBe(pkgRoot);
    } finally {
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});

describe("resolveWorkspaceTemplateDir", () => {
  it("prefers packageRoot/docs/... even when cwd is / (e.g. launchd)", async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "starforge-tpl-"));
    try {
      const pkgRoot = path.join(tmp, "node_modules", "starforgeos");
      await fs.mkdir(path.join(pkgRoot, "dist"), { recursive: true });
      await fs.mkdir(path.join(pkgRoot, "docs", "reference", "templates"), { recursive: true });
      await fs.writeFile(
        path.join(pkgRoot, "package.json"),
        JSON.stringify({ name: "starforgeos" }),
      );

      resetWorkspaceTemplateDirCache();
      const moduleUrl = pathToFileURL(path.join(pkgRoot, "dist", "agent-scope.js")).href;
      const templateDir = await resolveWorkspaceTemplateDir({
        cwd: "/",
        moduleUrl,
        argv1: "/usr/local/bin/starforge",
      });

      expect(templateDir).toBe(path.join(pkgRoot, "docs", "reference", "templates"));
      await expect(fs.access(path.join(templateDir))).resolves.toBeUndefined();
    } finally {
      resetWorkspaceTemplateDirCache();
      await fs.rm(tmp, { recursive: true, force: true });
    }
  });
});
