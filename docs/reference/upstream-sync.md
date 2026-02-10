---
summary: "How to pull upstream OpenClaw changes into a StarforgeOS fork without breaking a running gateway"
read_when:
  - You maintain a StarforgeOS fork of OpenClaw
  - You need to merge upstream without taking down the gateway mid-merge
title: "Upstream Sync (Fork Workflow)"
---

# Upstream sync (fork workflow)

## Goal

Keep your fork (StarforgeOS) rebranded and stable, while continuously bringing in upstream OpenClaw changes.

The key safety rule is simple:

- **Never run a merge in the same checkout that your Gateway is currently using.**

Do the merge in a separate git worktree, validate it, then restart/swap the Gateway to the updated checkout.

## Recommended setup

1. Add the upstream remote (once):

```bash
git remote add upstream https://github.com/openclaw/openclaw.git
git fetch upstream --tags
```

2. Keep two checkouts:

- **Runtime checkout**: the directory your Gateway is currently running from
- **Integration worktree**: used only for merges and validation

## Safe merge flow (worktree)

From your runtime checkout:

```bash
git fetch upstream --tags
```

Create an integration worktree (example name and location):

```bash
git worktree add ../starforgeOS-sync upstream/main -b sync/upstream-YYYY-MM-DD
cd ../starforgeOS-sync
```

Merge upstream into your fork branch:

```bash
git merge upstream/main
```

Resolve conflicts, then run the fork hardening steps:

```bash
pnpm install
pnpm tsgo
pnpm plugins:sync-manifests
starforge plugins doctor
pnpm test -- src/plugins/discovery.test.ts src/plugins/loader.test.ts
```

Notes:

- `pnpm plugins:sync-manifests` keeps `extensions/*/starforge.plugin.json` in sync with
  upstream `openclaw.plugin.json` so strict config validation does not break after merges.
- `starforge plugins doctor` should report no plugin load issues.

When the integration worktree is clean and validated:

1. Merge the integration branch back into your fork `main` (or your release branch).
2. Restart the Gateway from the updated checkout.

## What to avoid

- Avoid running `git pull`/merge/rebase from inside an agent that is hosted by the Gateway you are updating.
  If the merge changes plugin manifests, import paths, or build output, the running process can invalidate
  its own runtime and restart/crash mid-operation.
