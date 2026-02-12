# Discord Setup Audit Report (2026-02-12)

## Root Causes Found

- Discord guild channel bindings in `ops/config-snapshots/lobot.openclaw.redacted.json` used `peer.kind: "group"` with `peer.id: "channel:<id>"`.
- Runtime guild routing resolves Discord guild messages as `peer.kind: "channel"` with raw channel IDs, so those bindings did not match and fell through to default routing.
- `ops/config-snapshots/ackbot.openclaw.redacted.json` overrode `session.resetTriggers` with only `"SESSION_CHECKPOINT_COMPLETE"`.
- `initSessionState` previously treated `session.resetTriggers` as a full override, so `/new` and `/reset` stopped working when custom triggers were set.

## Exact Files Changed

- `ops/config-snapshots/lobot.openclaw.redacted.json`
- `ops/config-snapshots/ackbot.openclaw.redacted.json`
- `docs/channels/discord.md`
- `skills/coding-agent/SKILL.md`
- `src/auto-reply/reply/session.ts`
- `src/auto-reply/reply/session.test.ts`
- `ops/discord-audit-report-2026-02-12.md`

## Before/After Behavior

- Before: Guild channel bindings with `group` + `channel:<id>` failed to match Discord guild inbound routing.
- After: Bindings use `channel` + raw channel ID, matching inbound route shape.
- Before: `/new` in affected config looked like a soft/no-op reset because custom reset triggers disabled default `/new` and `/reset`.
- After: reset trigger evaluation keeps default `/new` + `/reset` and adds custom triggers, so session reset rotation is triggered as expected.
- Clarification: `/new` rotates `sessionId` within the same deterministic `sessionKey`; this is expected behavior unless routing/session scope changes.

## Validation Performed

- JSON syntax validation:
  - `jq empty ops/config-snapshots/lobot.openclaw.redacted.json`
  - `jq empty ops/config-snapshots/ackbot.openclaw.redacted.json`
- Known bad-pattern scan:
  - No remaining `"id": "channel:<id>"` peer IDs in snapshot bindings.
  - No remaining Discord binding `peer.kind: "group"` patterns for guild channel routes.
- Config validation via `validateConfigObject`:
  - `ackbot` snapshot: valid.
  - `lobot` snapshot: expected validation issue remains at `session.dmScope` because snapshot uses redacted placeholder (`"REDACTED"`).
- Dry/status checks:
  - `pnpm openclaw channels status --json`
  - `pnpm openclaw channels status --probe --json`
  - `pnpm openclaw doctor --non-interactive`

## Rollback Notes

- Revert this change set with:
  - `git checkout -- ops/config-snapshots/lobot.openclaw.redacted.json`
  - `git checkout -- ops/config-snapshots/ackbot.openclaw.redacted.json`
  - `git checkout -- docs/channels/discord.md`
  - `git checkout -- skills/coding-agent/SKILL.md`
- If only reset-trigger behavior must be rolled back, revert only `ops/config-snapshots/ackbot.openclaw.redacted.json`.

## Remaining Risks

- `ops/config-snapshots/lobot.openclaw.redacted.json` contains redacted placeholder values (for example `session.dmScope: "REDACTED"`), so strict schema validation of the redacted snapshot will continue to fail until replaced with concrete values.
- If deployed runtime configs diverge from these snapshots, equivalent fixes must be applied in the live config source as well.
