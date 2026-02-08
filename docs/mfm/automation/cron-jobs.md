# Cron Jobs

All cron jobs run as `systemEvent` into the main session. This uses OAuth/Claude Max (free) instead of `agentTurn` which spawns isolated sessions that hit billing errors.

See: [ADR-001-cron-systemEvent-codex.md](../decisions/ADR-001-cron-systemEvent-codex.md)

## Active Jobs

### Daily Metrics Snapshot

- **ID**: `cddb7822`
- **Schedule**: 3:00 AM ET
- **What**: Runs `scripts/daily-metrics-snapshot.py` — pulls 9 data sources (YouTube, Stripe, ConvertKit, GA, PostHog, Supabase) into `daily_business_metrics` table
- **Alerts**: If any source shows unexpected zeros or auth fails → #mfm Discord

### Overnight SEO Work

- **ID**: `d5637eea`
- **Schedule**: 3:30 AM ET
- **What**: Spawns Codex CLI (`codex --yolo exec`) for one high-impact SEO task on machinesformakers.com. Commits to feature branch, writes results to `memory/overnight-seo-log.md`
- **Tasks rotate**: Technical SEO, content optimization, keyword gaps, backlink work

### Morning Briefing

- **ID**: `a575e46f`
- **Schedule**: 5:00 AM ET
- **What**: Runs steps directly (no Codex spawn):
  1. Process emails (`scripts/process-emails.py`)
  2. Check overnight SEO work log
  3. Check calendar (today + tomorrow)
  4. SEO metrics (GA organic, 7-day comparison)
  5. Send briefing → Brandon's Discord DM

### Price Monitor Alert

- **ID**: `c70c428c`
- **Schedule**: 5:05 AM ET
- **What**: Checks `~/.openclaw/data/price-monitor-status.json`. If price extractor hasn't run in 24+ hours → alert #mfm Discord

### Weekly Business Report

- **ID**: `df79ee91`
- **Schedule**: Monday 5:30 AM ET
- **What**: Spawns Codex for full metrics report (revenue, Laser Lab, email growth, top content, anomalies) → #mfm Discord

### X Bookmarks Check

- **ID**: `20f6dcdd`
- **Schedule**: Every 2 hours
- **What**: Runs `scripts/check-x-bookmarks.sh`. New bookmarks → analyze content, extract insights → #bookmarks Discord

### Nightly Repo Audit

- **ID**: `97b494b0`
- **Schedule**: 10:30 PM ET
- **What**: Runs `scripts/nightly-repo-audit.sh` — commits workspace changes, pre-commit scan, security audit, pushes if clean

### Nightly Memory Extraction

- **ID**: `6bf4c862`
- **Schedule**: 11:00 PM ET
- **What**: Runs `scripts/extract-transcripts.sh`, reads transcript, extracts durable facts → daily notes, knowledge graph, MEMORY.md. Most important automated job.

### Nightly Security Audit

- **ID**: `1698c119`
- **Schedule**: 11:45 PM ET
- **What**: Runs `scripts/security-audit.sh` — checks for leaked secrets in configs/logs. Issues → #security Discord

## Disabled Jobs

### Afternoon Briefing

- **ID**: `026e8694`
- **Status**: Disabled (was `agentTurn`, not yet converted)

### Making It Podcast Check

- **ID**: `5edba385`
- **Status**: Disabled (moved to LaunchAgent for reliability)

## Key Lesson

`agentTurn` isolated sessions use a different auth path than the main session. Main session uses OAuth/Max (free), but isolated sessions hit "API key has run out of credits." All jobs converted to `systemEvent` to avoid this.
