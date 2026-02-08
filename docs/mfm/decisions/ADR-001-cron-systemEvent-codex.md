# ADR-001: Cron Jobs via systemEvent + Codex CLI (Not agentTurn API)

## Status

Active

## Date

2026-02-08

## Context (The Problem)

All 9 StarforgeOS cron jobs were configured as `agentTurn` isolated sessions. These hit the Anthropic API directly with a bearer token. On 2026-02-08, the token hit a billing wall:

> ⚠️ API provider returned a billing error — your API key has run out of credits or has an insufficient balance.

This error fired every time a cron job triggered, spamming the #mfm Discord channel. Meanwhile, the main session (using the same auth config) worked fine — it's covered by the Claude Max subscription ($200/month, unlimited usage).

Brandon's directive: "No those should be Claude code cli sessions not api key stuff" and "Nothing in our starforge or lobot openclaw should have an open ai or Anthropic api key. We only do oauth."

## What We Tried

- ❌ `agentTurn` isolated sessions: Hit billing errors. Each job spun up a fresh session hitting the API. Token auth was ambiguous (OAuth session token treated as API key?). No way to use Codex 5.3 from inside these sessions.
- ❌ Converting to LaunchAgent/crontab scripts: Would bypass StarforgeOS entirely, losing scheduling visibility and management.
- ✅ `systemEvent` targeting main session + Codex CLI: Main session wakes up, reads the instruction, spawns `codex --yolo exec` for heavy work or runs scripts directly for simple tasks. Uses Claude Max subscription (free). Full tool access.

## Decision

Convert all 9 cron jobs from `agentTurn` (isolated) to `systemEvent` (main session):

- **Simple jobs** (metrics, price monitor, security audit, repo audit, X bookmarks): Main session runs scripts directly
- **Complex jobs** (overnight SEO, morning briefing, weekly report): Main session spawns `codex --yolo exec` (Codex 5.3)
- **Memory extraction**: Main session handles it directly (Opus 4.6, needs full LLM reasoning)

All jobs use `wakeMode: "now"` to ensure they fire even outside heartbeat active hours (3am, 11pm).

## Consequences

**Good:**

- No more billing errors — everything runs through the main session's auth
- Codex 5.3 for heavy coding tasks (SEO, reports) — better tool access and reliability
- Memory extraction gets full main session context instead of starting from scratch
- Single point of visibility — all cron activity visible in main session logs
- Free under Claude Max subscription

**Bad:**

- Main session context grows with each cron event (mitigated by compaction)
- If main session is busy processing a message when cron fires, the event queues (acceptable for overnight jobs)
- Memory extraction no longer gets a clean isolated context (but gains continuity with the day's work)

## Supersedes

None — original cron setup was ad-hoc, never formally documented.

## Related

- ADR-002 (planned): Auth model — OAuth only, no raw API keys
- ADR-003 (planned): Memory extraction pipeline architecture
