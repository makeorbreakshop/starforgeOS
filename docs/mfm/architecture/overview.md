# System Overview

Two AI agents on separate Macs, connected via Tailscale, sharing memory through git.

## Hardware

| Machine       | Tailscale IP   | Agent         | Role                                               |
| ------------- | -------------- | ------------- | -------------------------------------------------- |
| Mac Studio    | 100.95.106.45  | **Ackbot** 🦑 | MFM business, monitoring, email, coding delegation |
| Mac Mini      | 100.94.86.43   | **Lobot** 🤖  | Family Hub, home automation, iMessage relay        |
| MacBook Pro   | 100.99.212.120 | —             | Brandon's laptop                                   |
| NAS           | 100.87.124.19  | —             | Immich photos, backups                             |
| iPhone 14 Pro | 100.104.72.5   | —             | Mobile (no SSH)                                    |

## Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TAILSCALE NETWORK                            │
│                      (tail1e8b7c.ts.net)                           │
├─────────────────────────────┬───────────────────────────────────────┤
│                             │                                       │
│  ┌───────────────────┐      │      ┌───────────────────┐           │
│  │   MAC STUDIO      │      │      │   MAC MINI        │           │
│  │   Ackbot 🦑       │◄─────┼─────►│   Lobot 🤖        │           │
│  │   Chief of Staff  │      │      │   Home Automation  │           │
│  └────────┬──────────┘      │      └────────┬──────────┘           │
│           │                 │               │                       │
│           ▼                 │               ▼                       │
│  ┌───────────────────┐      │      ┌───────────────────┐           │
│  │  ~/shared-memory/ │◄─────┼─────►│  ~/shared-memory/ │           │
│  │  (git sync 5min)  │      │      │  (git sync 5min)  │           │
│  └───────────────────┘      │      └───────────────────┘           │
│                             │                                       │
└─────────────────────────────┴───────────────────────────────────────┘
                              │
                              ▼
                ┌─────────────────────────┐
                │   GitHub (private)      │
                │   makeorbreakshop/      │
                │   shared-memory         │
                └─────────────────────────┘
```

## StarforgeOS Gateway

Each machine runs a **StarforgeOS gateway daemon** that:

- Manages sessions (conversations with context, memory, tool access)
- Routes messages from chat surfaces (Discord, webchat) to AI models
- Executes cron jobs on schedule
- Provides skill/tool access to agents

**Key config**: `~/.starforge/starforge.json`
**Port**: 18789 (localhost only)
**LaunchAgent**: `ai.starforge.gateway` (auto-starts on boot)
**Auth**: OAuth only (Claude Max subscription) — no raw API keys

## Models

| Task                   | Model               | Why                     |
| ---------------------- | ------------------- | ----------------------- |
| PM, coordination, text | Claude Opus 4.6     | Nuance, judgment        |
| All coding             | Codex CLI (GPT 5.3) | Fresh context, no drift |
| Quick tasks            | Claude Sonnet       | Faster, cheaper         |
