# Nightly Security Audit

Runs at 11:45 PM ET via cron job `1698c119`.

## What It Checks

- `scripts/security-audit.sh` runs the full scan
- Checks configs and logs for leaked API keys/tokens
- Verifies OAuth-only auth (no raw keys)
- Scans recent commits for secret patterns
- Pre-commit regex patterns for common key formats

## Alerting

- Issues found → #security Discord (`1468978750157754411`)
- Clean → logged to daily memory file silently

## TODO

- Add `sk-proj-` (OpenAI) and `sk-ant-` (Anthropic) to `redactPatterns` in starforge.json
- Add API key check to nightly cron
