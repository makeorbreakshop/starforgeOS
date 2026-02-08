# LaunchAgents (macOS)

These run independently of StarforgeOS — they fire even if the gateway is down.

## Mac Studio

| Plist                                | Purpose                                     | Schedule       |
| ------------------------------------ | ------------------------------------------- | -------------- |
| `ai.starforge.gateway`               | StarforgeOS daemon                          | Always running |
| `ai.openclaw.gmail-work`             | Gmail webhook (brandon@makeorbreakshop.com) | Port 8788      |
| `ai.openclaw.gmail-personal`         | Gmail webhook (brandonrcullum@gmail.com)    | Port 8789      |
| `ai.openclaw.agentmail-webhook`      | AgentMail webhook (ackbot@agentmail.to)     | Port 8791      |
| `com.machinesformakers.pricetracker` | Price extractor cron runner                 | 3:00 AM        |
| `com.mfm.price-monitor`              | Price staleness checker                     | LaunchAgent    |
| `com.mfm.youtube-sync`               | YouTube analytics daily sync                | 6:00 AM        |
| `com.mfm.podcast-check`              | Making It podcast check                     | Fri 5:15 AM    |
| `com.mfm.webhook-healthcheck`        | Webhook server health                       | Hourly         |

## When to Use LaunchAgent vs Cron Job

| LaunchAgent                  | StarforgeOS Cron                   |
| ---------------------------- | ---------------------------------- |
| Simple pass/fail checks      | AI interpretation needed           |
| Must fire if gateway is down | Morning briefings, reports         |
| Zero token cost              | Growth analysis, memory extraction |
| Exact timing critical        | Tasks that read/write memory       |

## Troubleshooting

```bash
# List loaded agents
launchctl list | grep -E "openclaw|mfm|starforge|machinesformakers"

# Load/unload
launchctl load ~/Library/LaunchAgents/com.example.plist
launchctl unload ~/Library/LaunchAgents/com.example.plist

# Check if running
launchctl list com.machinesformakers.pricetracker
```

Plists live at `~/Library/LaunchAgents/`, permissions `chmod 600`.
