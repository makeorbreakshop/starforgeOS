# Discord

Primary chat surface for both Brandon and agent communication.

## Channels

| Channel     | ID                    | Purpose                            |
| ----------- | --------------------- | ---------------------------------- |
| #mfm        | `1468671572612223238` | MFM business (isolated session)    |
| #bookmarks  | `1469860225963266069` | X/Twitter bookmark summaries       |
| #security   | `1468978750157754411` | Security audit alerts              |
| #monitoring | `1469286845731962933` | Health checks, system alerts       |
| DMs         | —                     | Main session (shared with webchat) |

## Guild

- **ID**: `1253735279676756050`
- **Brandon's user ID**: `584579716200267808`

## Session Routing

- **DMs** → main session
- **Guild channels** → isolated session per channel
- Memory files shared across all sessions

## Monitoring Webhooks

Direct Discord webhooks (no AI routing) for reliability:

- Requires `User-Agent: MFM-*/1.0` header
- Used by LaunchAgent alert scripts

## Formatting Rules

- No markdown tables (unreadable on mobile) — use bullet lists
- Wrap multiple links in `<>` to suppress embeds
- Inline buttons not enabled (would need config change)
