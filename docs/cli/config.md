---
summary: "CLI reference for `starforge config` (get/set/unset config values)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `starforge config`

Config helpers: get/set/unset values by path. Run without a subcommand to open
the configure wizard (same as `starforge configure`).

## Examples

```bash
starforge config get browser.executablePath
starforge config set browser.executablePath "/usr/bin/google-chrome"
starforge config set agents.defaults.heartbeat.every "2h"
starforge config set agents.list[0].tools.exec.node "node-id-or-name"
starforge config unset tools.web.search.apiKey
```

## Paths

Paths use dot or bracket notation:

```bash
starforge config get agents.defaults.workspace
starforge config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
starforge config get agents.list
starforge config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--json` to require JSON5 parsing.

```bash
starforge config set agents.defaults.heartbeat.every "0m"
starforge config set gateway.port 19001 --json
starforge config set channels.whatsapp.groups '["*"]' --json
```

Restart the gateway after edits.
