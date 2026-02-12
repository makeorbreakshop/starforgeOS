---
name: coding-agent
description: Run coding work through CLI agents (Codex default, Claude Code when explicitly requested or for design/frontend/copy). Use for implementation, refactors, bug fixes, and test work that should run in a project directory via PTY/background process.
metadata: { "openclaw": { "emoji": "🧩", "requires": { "anyBins": ["codex", "claude"] } } }
---

# Coding Agent

Use CLI coding agents for all implementation work. Do not hand-code patches directly in orchestrator mode.

## Defaults

- **Default agent:** Codex
- **Default Codex command:** `codex --yolo exec '<prompt>'`
- **Default model:** `gpt-5.3-codex`
- **Claude usage:** only when user explicitly asks, or task is primarily design/frontend/copy
- **Claude command:** `claude --dangerously-skip-permissions '<prompt>'`
- **Always:** `pty:true`, correct `workdir`, background mode for longer runs

## Clarify First (when needed)

Before launch, ask concise clarifying questions only if missing details would risk wrong implementation.

Minimum checklist:

1. Target repo/path?
2. Desired behavior / acceptance criteria?
3. Any constraints (files to avoid, test scope, no schema changes, etc.)?

If clear enough, launch immediately.

## Launch Protocol (mandatory)

1. **Announce start** in one line (what + where).
2. **Launch with PTY** in project directory.
3. **Track session** in `memory/active-codex-sessions.json`.
4. **Require wake callback** in prompt.
5. **Poll as backup** until completion; report results.

### Canonical launch examples

```bash
# Codex (default)
exec pty:true background:true workdir:<TARGET_DIR> command:"codex --yolo exec '<prompt>'"

# Claude Code (when explicitly requested / design/frontend/copy)
exec pty:true background:true workdir:<TARGET_DIR> command:"claude --dangerously-skip-permissions '<prompt>'"
```

## Quote-safe prompting (required for apostrophes/multiline)

Use prompt files/heredocs instead of fragile inline quoting.

```bash
PROMPT_FILE=$(mktemp)
cat > "$PROMPT_FILE" <<'EOF'
<full prompt here>
EOF

codex --yolo exec "$(cat "$PROMPT_FILE")"
rm -f "$PROMPT_FILE"
```

## Testing & Quality Gates

### Bug fixes: strict TDD required

Use red → green → refactor every time.

- Write failing test first.
- Confirm it fails for the right reason.
- Implement minimal fix.
- Re-run and confirm pass.
- Refactor safely; re-run tests.

### All code changes: test coverage required

Even for non-bug changes, run appropriate tests for changed behavior before declaring done.

### Completion gate (must pass before saying "fixed")

- For bug fixes: failing repro test existed before fix.
- Changed-area tests pass.
- Related regression tests pass.
- User-facing claim matches verified evidence.

Include this line in bug-fix prompts:

`Use strict TDD: write failing tests first, confirm failure, implement minimal fix, and run targeted + related tests before declaring done.`

## Monitoring

- Use `process action:poll` for status.
- Use `process action:log` with `limit` (40–120 lines).
- Do not dump full logs into chat.
- If run fails/stalls, report immediately with key error lines.

## Wake callback (mandatory in prompt)

Append this to all long runs:

```text
When done: cd /Users/brandoncullum/starforgeOS && pnpm openclaw gateway call wake --params '{"text":"Done: <brief summary>","mode":"now"}'
```

## Hard rules

1. Always `pty:true`.
2. Use Codex by default.
3. Use Claude only when requested or clearly design/frontend/copy heavy.
4. Do not use `--full-auto` for Codex unless Brandon explicitly asks.
5. Never claim completion without tests.
6. Never silently abandon a run; report status/failure.
