---
summary: "CLI reference for `starforge agents` (list/add/delete/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `starforge agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
starforge agents list
starforge agents add work --workspace ~/.starforgeos/workspace-work
starforge agents set-identity --workspace ~/.starforgeos/workspace --from-identity
starforge agents set-identity --agent main --avatar avatars/starforgeos.png
starforge agents delete work
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.starforgeos/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
starforge agents set-identity --workspace ~/.starforgeos/workspace --from-identity
```

Override fields explicitly:

```bash
starforge agents set-identity --agent main --name "StarforgeOS" --emoji "🦞" --avatar avatars/starforgeos.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "StarforgeOS",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/starforgeos.png",
        },
      },
    ],
  },
}
```
