# Coding Workflow

Ackbot does **zero coding directly**. All implementation goes through Codex CLI.

## Hierarchy

```
Brandon (decides) → Ackbot (PM, scopes work) → Codex CLI (implements)
                                                      ↓
                                                Codex sub-agents (if needed)
```

## Codex CLI

- **Model**: GPT 5.3 Codex (high reasoning)
- **Config**: `~/.codex/config.toml`
- **Auth**: OAuth via Claude Max subscription (free)
- **Always**: `--yolo` flag (no sandbox, full network access)

### Invocation

```bash
# One-shot task
codex --yolo exec 'Task description here'

# Always use pty:true and background:true
# NEVER set timeout — Codex tasks can take 30-60+ minutes
```

### Session Reuse

- **New task** → spawn fresh: `codex --yolo exec "..."`
- **Follow-up on same task** → reuse: `process action:submit sessionId:XXX data:"follow-up"`

### Completion Notification

Include in prompts so Codex pings when done:

```
When done: openclaw gateway call wake --params '{"text":"Done: [summary]","mode":"now"}'
```

### Parallel Work

For unrelated tasks, use git worktrees:

```bash
git worktree add -b feature/thing /tmp/thing main
# Then spawn Codex in /tmp/thing
```

## Why Codex Over Sub-Agents

- **Fresh context**: Reads files/git each run — no accumulated hallucinations
- **No drift**: Sub-agents share session context and compound errors
- **Amnesia is a feature**: Clean slate every time
