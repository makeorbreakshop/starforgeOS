# Memory System

Three layers, like a human brain.

## 1. Working Memory (Session Context)

- Current conversation + compacted history
- Compaction triggers at 60% token usage (reserve floor: 80K tokens)
- **Lost on session restart** — always flush important state to files before compaction

## 2. Short-Term Memory (Daily Notes)

- **Location**: `memory/YYYY-MM-DD.md`
- Raw, chronological logs of what happened each day
- Written during sessions, flushed on compaction
- Includes: decisions, action items, technical findings, operational notes

## 3. Long-Term Memory (MEMORY.md)

- **Location**: `MEMORY.md` (workspace root)
- Curated operational knowledge — the distilled essence, not raw logs
- Target: <15K chars
- Updated during nightly extraction or heartbeat maintenance
- **Security**: Only loaded in main session (never in group chats)

## What Goes Where

| Info Type                               | Location                      |
| --------------------------------------- | ----------------------------- |
| What happened today                     | `memory/YYYY-MM-DD.md`        |
| Durable patterns, lessons, preferences  | `MEMORY.md`                   |
| Structured facts about people/companies | `knowledge/` graph            |
| Session transcripts                     | `memory/transcripts/`         |
| Heartbeat state                         | `memory/heartbeat-state.json` |

## Shared Memory

Agents share memory via git repo `makeorbreakshop/shared-memory`:

- Syncs every 5 minutes (both machines)
- **Ackbot owns extraction** — runs nightly at 11 PM ET
- Writing rules: append-only for logs, include `[ackbot]` or `[lobot]` + timestamp

## QMD Search

Local semantic search over memory + knowledge:

```bash
qmd search "query"    # Fast keyword search
qmd vsearch "query"   # Semantic search
qmd query "query"     # Hybrid + reranking (best quality)
qmd get "path/file"   # Retrieve full document
```
