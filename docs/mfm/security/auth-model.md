# Auth Model

**OAuth only. No raw API keys. Ever.**

See: [ADR-002-oauth-only-no-api-keys.md](../decisions/ADR-002-oauth-only-no-api-keys.md)

## How It Works

- StarforgeOS gateway authenticates via **Claude Max subscription** (OAuth/token mode)
- Auth profiles in `~/.starforge/starforge.json` use `"mode": "token"` for Anthropic providers
- Values redacted with `__STARFORGEOS_REDACTED__` in config display
- Codex CLI also uses OAuth (free via Max subscription)

## What's Verified (2026-02-08)

- ✅ **Ackbot (Mac Studio)**: OAuth only (brandon@makeorbreakshop.com)
- ✅ **Lobot (Mac Mini)**: OAuth only, no API key
- ✅ **starforge.json**: No raw keys, token mode only

## Known Gap

- Logging `redactPatterns` missing OpenAI (`sk-proj-`) and Anthropic (`sk-ant-`) key patterns
- TODO: Add these patterns to prevent accidental logging

## Auth Path Difference

- **Main session** (systemEvent): Uses OAuth/Max → free
- **Isolated session** (agentTurn): Different auth path → hits "API key has run out of credits"
- This is why all cron jobs were converted from agentTurn to systemEvent
