# Data Flow

## Message Flow

```
User (Discord/DM/Webchat)
        │
        ▼
StarforgeOS Gateway (port 18789)
        │
        ├── Route to session (main or isolated)
        │
        ▼
Session (Claude model)
        │
        ├── Read/write memory files
        ├── Execute skills/tools
        ├── Spawn Codex CLI for coding
        └── Send responses back to chat surface
```

## Cron Job Flow

```
Cron scheduler (StarforgeOS)
        │
        ▼
systemEvent → Main Session
        │
        ├── Run script (python/bash)
        ├── Check data, generate reports
        ├── Spawn Codex if heavy work needed
        └── Alert Discord if issues found
```

## Shared Memory Sync

```
Mac Studio (Ackbot)          Mac Mini (Lobot)
        │                           │
        ▼                           ▼
~/shared-memory/             ~/shared-memory/
        │                           │
        └──── git push/pull ────────┘
                    │
                    ▼
           GitHub (private repo)
           makeorbreakshop/shared-memory
```

- Sync interval: every 5 minutes
- Ackbot owns nightly extraction (11 PM ET)
- Lobot does NOT run extraction

## Gmail Pipeline

```
Gmail (Pub/Sub) → Tailscale Funnel → gog watcher (port 8788/8789)
        │
        ▼
Filter Proxy (port 8790)
        │
        ├── VIP/urgent → immediate wake (port 18789/hooks/gmail)
        └── Non-urgent → queued for batch triage (morning/afternoon briefing)
```
