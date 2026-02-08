# Lobot 🤖

## Identity

- **Machine**: Mac Mini (100.94.86.43)
- **Model**: Claude (via separate StarforgeOS instance)
- **Role**: Secondary agent — personal/family tasks
- **SSH**: user `lobot`, password in 1Password

## Scope

- Family Hub dashboard
- Home automation
- iMessage relay (BlueBubbles, AppleScript mode)
- Personal tasks separate from MFM business

## Relationship to Ackbot

- **Shared memory**: GitHub repo `makeorbreakshop/shared-memory` (syncs every 5 min)
- **Independent**: Separate StarforgeOS instance, separate config
- **Ackbot owns extraction**: Nightly transcript extraction runs on Mac Studio only
- **Kill switch**: Ackbot can SSH to Mac Mini to restart/stop Lobot

## Security

- OAuth only, no API keys (verified 2026-02-08)
- Separate from MFM business data
- Does NOT run nightly extraction
