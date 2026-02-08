# AgentMail

Dedicated agent email address for receiving messages.

## Address

`ackbot@agentmail.to`

## Architecture

- **Primary**: Webhook (real-time) — AgentMail → Funnel → port 8791 → StarforgeOS wake
- **Backup**: Polling during heartbeats via `scripts/check-agentmail.py`
- **LaunchAgent**: `ai.openclaw.agentmail-webhook`

## Health Check

```bash
# Verify webhook server running
/usr/sbin/lsof -i :8791
curl -s http://127.0.0.1:8791/

# If down, reload
launchctl load ~/Library/LaunchAgents/ai.openclaw.agentmail-webhook.plist
```

## API Access

Token stored in 1Password (vault: MOBS, item: AgentMail).

```bash
export OP_SERVICE_ACCOUNT_TOKEN=$(security find-generic-password -a "ackbot" -s "1password-service-account" -w)
curl -s -H "Authorization: Bearer $(op read 'op://MOBS/AgentMail/credential')" \
  "https://api.agentmail.to/v0/inboxes/ackbot@agentmail.to/threads?limit=10"
```
