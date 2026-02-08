# Monitoring

Uses **launchd + direct Discord webhooks** for reliability. No AI routing for alerts.

## Discord

- **Channel**: #monitoring (`1469286845731962933`)
- **Webhook**: Direct POST, requires `User-Agent: MFM-*/1.0` header

## Alert Scripts

| Script                        | Schedule              | What                                         |
| ----------------------------- | --------------------- | -------------------------------------------- |
| `daily-metrics-snapshot.py`   | 3 AM (cron)           | YouTube 5+ days zeros, CK 0 subs, LL 0 users |
| `youtube-daily-sync.py`       | 6 AM (launchd)        | Sync failures                                |
| `check-podcast-feed-alert.py` | Fri 5:15 AM (launchd) | New Making It episode                        |
| `check-webhook-servers.py`    | Hourly (launchd)      | Gmail/AgentMail servers down                 |

## Health Monitor

- Runs every 15 minutes
- Cross-machine checks (Mac Studio ↔ Mac Mini)
- Results → #monitoring Discord

## Error Monitoring

- **Sentry** configured for machines-for-makers
- Known noise: React hydration errors (`insertBefore` / `removeChild`)
