# Gmail

Two accounts managed via `gog` CLI (OAuth).

## Accounts

- **Work**: brandon@makeorbreakshop.com
- **Personal**: brandonrcullum@gmail.com

## Inbound Flow

```
Gmail (Pub/Sub) → Tailscale Funnel → gog watcher → Filter Proxy → StarforgeOS
```

### Watcher LaunchAgents

| Agent                        | Port | Account                     |
| ---------------------------- | ---- | --------------------------- |
| `ai.openclaw.gmail-work`     | 8788 | brandon@makeorbreakshop.com |
| `ai.openclaw.gmail-personal` | 8789 | brandonrcullum@gmail.com    |

### Filter Proxy

- **Script**: `scripts/gmail-filter-proxy.py` (port 8790)
- **VIP rules**: `skills/email-triage/config/triage-rules.json`
- **VIP senders** (immediate wake): Haley, school domains
- **Family domains**: ClassDojo, ProCare, UGA
- **Non-urgent**: Queued for batch triage during briefings

### State Files

- `data/gmail-filter-state.json` — pending queue
- `data/gmail-filter-state.lock` — concurrency lock
- `data/gmail-filter.log` — runtime logs

## Email Triage

Two implementations in `skills/email-triage/`:

- **gog version** (preferred): `scripts/gog-triage.py`
- **IMAP version**: `scripts/email-triage.py`
- **Classification**: local Ollama (`qwen2.5:3b`) with heuristic fallback
- **State**: `data/email-triage.json`

## Important

- Use **Opus** for all email work — Sonnet got ~30% accuracy on triage
- Browser automation for Google accounts fails (bot detection)
