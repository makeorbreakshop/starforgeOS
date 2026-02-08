# Sessions

## Types

- **Main session**: Discord DMs + webchat share one continuous conversation. Full tool access, memory, skills.
- **Isolated sessions**: Each Discord guild channel gets its own session with separate context. Same tools, shared memory files.
- **Cron sessions**: Scheduled jobs fire as `systemEvent` into the main session (uses OAuth = free).

## Routing

```
Discord DM / Webchat  →  Main Session (Opus 4.6)
Discord #channel      →  Isolated Session (per-channel)
Cron systemEvent      →  Main Session
```

## Compaction

Sessions compact at 60% token usage to stay within context limits.

- Reserve floor: 80,000 tokens
- Compacted context is summarized, not lost
- Memory flush happens before compaction (writes to `memory/YYYY-MM-DD.md`)

## Memory Loading

Per session type:

- **Main session**: Loads SOUL.md, USER.md, AGENTS.md, MEMORY.md, recent daily notes
- **Isolated sessions**: Loads SOUL.md, USER.md, AGENTS.md (NOT MEMORY.md — security)
- **Why**: MEMORY.md contains personal context that shouldn't leak to group chats with strangers

## Sub-agents

The main session can spawn:

- **Codex CLI** for coding work (fresh context each run)
- **Sub-agent sessions** via `sessions_spawn` for parallel tasks
- Sub-agents announce results back to the spawning session
