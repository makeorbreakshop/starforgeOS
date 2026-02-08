# Monitoring Infrastructure

## Overview

Monitoring uses **launchd + direct Discord webhooks** for reliability. No AI routing bottleneck - alerts fire even if OpenClaw is down.

**Discord Channel:** #monitoring (`1469286845731962933`)
**Webhook:** `https://discord.com/api/webhooks/1469287188104483064/...`

## Alert Scripts

### Daily Metrics Snapshot

**Script:** `~/.openclaw/workspace/scripts/daily-metrics-snapshot.py`
**Schedule:** OpenClaw cron, 3am ET
**Alerts on:**

- YouTube: 5+ consecutive days of zero views
- ConvertKit: API returns 0 total subscribers
- Laser Lab: profiles table returns 0 users
- GA: 0 sessions/users (warning, yellow)
- PostHog: 0 DAU (warning, yellow)

### YouTube Sync

**Script:** `~/machines-for-makers/scripts/youtube-daily-sync.py`
**Schedule:** launchd `com.mfm.youtube-sync`, 6am ET
**Alerts on:** Any sync failure (API errors, auth issues, DB errors)

### Podcast Monitor (Making It)

**Script:** `~/.openclaw/workspace/scripts/check-podcast-feed-alert.py`
**Schedule:** launchd `com.mfm.podcast-check`, Fridays 5:15am ET
**Alerts on:** New episode detected in RSS feed
**RSS:** `https://feeds.castos.com/v2m7m`

### Webhook Health Check

**Script:** `~/.openclaw/workspace/scripts/check-webhook-servers.py`
**Schedule:** launchd `com.mfm.webhook-healthcheck`, every hour
**Alerts on:** Any webhook server not responding:

- Gmail Work (port 8788)
- Gmail Personal (port 8789)
- AgentMail (port 8791)

## LaunchAgent Locations

All plists in `~/Library/LaunchAgents/`:

| Plist                                 | Purpose                  | Schedule   |
| ------------------------------------- | ------------------------ | ---------- |
| `com.mfm.youtube-sync.plist`          | YouTube analytics        | Daily 6am  |
| `com.mfm.podcast-check.plist`         | Making It podcast        | Fri 5:15am |
| `com.mfm.webhook-healthcheck.plist`   | Server health            | Hourly     |
| `ai.openclaw.gmail-work.plist`        | Gmail webhook (work)     | Always     |
| `ai.openclaw.gmail-personal.plist`    | Gmail webhook (personal) | Always     |
| `ai.openclaw.agentmail-webhook.plist` | AgentMail webhook        | Always     |

## Managing LaunchAgents

```bash
# Check status
launchctl list | grep -E "(mfm|openclaw)"

# Reload a job
launchctl unload ~/Library/LaunchAgents/com.mfm.podcast-check.plist
launchctl load ~/Library/LaunchAgents/com.mfm.podcast-check.plist

# View logs
tail -f ~/.openclaw/workspace/logs/webhook-healthcheck.log
tail -f ~/machines-for-makers/logs/youtube-sync.log
```

## Discord Webhook Requirements

**CRITICAL:** Discord webhooks require a `User-Agent` header or Cloudflare returns 403.

Pattern: `MFM-{ScriptName}/1.0`

```python
headers = {
    "Content-Type": "application/json",
    "User-Agent": "MFM-MetricsSnapshot/1.0"
}
```

## Adding New Alerts

1. Create script in `~/.openclaw/workspace/scripts/`
2. Use the `send_alert()` function pattern:

```python
import json
import urllib.request
from datetime import datetime

DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1469287188104483064/A-07kCfyI5wqQRKQ4SfJb3miFXVu-PShHc8ZAFfcB5eqRwfbPVRZHJDuLuf359__Bwjt"

def send_alert(title: str, message: str, color: int = 15158332):
    """Send alert to Discord. Colors: 15158332=red, 16776960=yellow, 5763719=green"""
    payload = {
        "embeds": [{
            "title": f"⚠️ {title}",
            "description": message,
            "color": color,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }]
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        DISCORD_WEBHOOK,
        data=data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "MFM-YourScript/1.0"
        }
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.status == 204
```

3. Create launchd plist if scheduled:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.mfm.your-check</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/python3</string>
        <string>/Users/brandoncullum/.openclaw/workspace/scripts/your-script.py</string>
    </array>

    <key>StartCalendarInterval</key>
    <dict>
        <key>Hour</key>
        <integer>6</integer>
        <key>Minute</key>
        <integer>0</integer>
    </dict>

    <key>StandardOutPath</key>
    <string>/Users/brandoncullum/.openclaw/workspace/logs/your-check.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/brandoncullum/.openclaw/workspace/logs/your-check.log</string>
</dict>
</plist>
```

4. Load it: `launchctl load ~/Library/LaunchAgents/com.mfm.your-check.plist`

## Why Not OpenClaw Cron?

OpenClaw cron routes through AI, which adds:

- Token cost per execution
- Potential interpretation errors
- Failure if OpenClaw is down

Launchd + direct webhooks:

- Zero tokens
- Fires even if OpenClaw crashes
- Exact timing (not polling-based)

**Use OpenClaw cron for:** Tasks that need AI interpretation (morning briefings, growth analysis)
**Use launchd for:** Simple pass/fail monitoring that should always fire
