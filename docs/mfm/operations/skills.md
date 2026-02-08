# Skills

Pluggable capabilities installed at `~/.openclaw/workspace/skills/`. Each has a `SKILL.md` the agent reads when the task matches.

## Key Skills in Use

| Skill             | Purpose                                   |
| ----------------- | ----------------------------------------- |
| `gog`             | Gmail, Google Calendar, Drive (OAuth CLI) |
| `github`          | PRs, issues, CI via `gh` CLI              |
| `1password`       | Secrets management (vault: MOBS)          |
| `himalaya`        | IMAP email (alternative to gog)           |
| `email-triage`    | AI email classification                   |
| `x-bookmarks`     | Twitter bookmark monitoring               |
| `deep-research`   | Multi-agent web research                  |
| `coding-agent`    | Codex/Claude Code spawning                |
| `spotify-player`  | Music control (spogo)                     |
| `weather`         | Forecasts (no API key)                    |
| `openhue`         | Philips Hue lights                        |
| `bluebubbles`     | iMessage relay                            |
| `apple-notes`     | Apple Notes via `memo` CLI                |
| `apple-reminders` | Apple Reminders via `remindctl`           |
| `peekaboo`        | macOS UI automation                       |

## Installing Skills

New skills available at [clawhub.com](https://clawhub.com).

⚠️ ClawHub skills are **supply chain attack vectors** — don't install without code review.

## Custom Skills

| Skill               | Purpose                                |
| ------------------- | -------------------------------------- |
| `email-triage`      | IMAP scanning + AI classification      |
| `vercel-deploy-fix` | Diagnose/fix failed Vercel deployments |
| `claude-websearch`  | Web search via Claude Code CLI         |
