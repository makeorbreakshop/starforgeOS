---
summary: "CLI reference for `starforge plugins` (list, install, enable/disable, doctor)"
read_when:
  - You want to install or manage in-process Gateway plugins
  - You want to debug plugin load failures
title: "plugins"
---

# `starforge plugins`

Manage Gateway plugins/extensions (loaded in-process).

Related:

- Plugin system: [Plugins](/tools/plugin)
- Plugin manifest + schema: [Plugin manifest](/plugins/manifest)
- Security hardening: [Security](/gateway/security)

## Commands

```bash
starforge plugins list
starforge plugins info <id>
starforge plugins enable <id>
starforge plugins disable <id>
starforge plugins doctor
starforge plugins update <id>
starforge plugins update --all
```

Bundled plugins ship with StarforgeOS but start disabled. Use `plugins enable` to
activate them.

All plugins must ship a `starforge.plugin.json` file with an inline JSON Schema
(`configSchema`, even if empty). Missing/invalid manifests or schemas prevent
the plugin from loading and fail config validation.

### Install

```bash
starforge plugins install <path-or-spec>
```

Security note: treat plugin installs like running code. Prefer pinned versions.

Supported archives: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Use `--link` to avoid copying a local directory (adds to `plugins.load.paths`):

```bash
starforge plugins install -l ./my-plugin
```

### Update

```bash
starforge plugins update <id>
starforge plugins update --all
starforge plugins update <id> --dry-run
```

Updates only apply to plugins installed from npm (tracked in `plugins.installs`).
