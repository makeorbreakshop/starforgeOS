# StarForge Tools

Collaborative document editor with agent @mentions.

## Location

- **Codebase**: `/Users/brandoncullum/starforge-tools`
- **StarforgeOS fork**: `/Users/brandoncullum/starforgeOS`
- **Launcher**: `starforge-launch` (symlinked to `/opt/homebrew/bin/`)

## Architecture (pnpm monorepo)

| Package           | Port | Purpose                                                      |
| ----------------- | ---- | ------------------------------------------------------------ |
| `apps/web`        | 3000 | Vite + TipTap document editor UI                             |
| `apps/api`        | 3001 | Hono REST API (CRUD for workspaces, folders, docs, comments) |
| `apps/bridge`     | 9876 | Webhook receiver → StarforgeOS gateway client                |
| `packages/db`     | —    | Drizzle ORM + better-sqlite3                                 |
| `packages/shared` | —    | HMAC utils, Zod schemas                                      |

## How @Mentions Work

1. User @mentions agent in a document comment
2. API creates `mentionEvent`, POSTs webhook to bridge
3. Bridge connects to StarforgeOS gateway via WebSocket (protocol v3)
4. Agent processes comment thread context, generates response
5. Response POSTed back to API → reply on comment thread

## Quick Start

```bash
starforge-launch          # start everything
starforge-launch status   # health check + URLs
starforge-launch restart  # restart all services
starforge-launch stop     # stop tools (gateway stays up)
```

## URLs

- **Editor**: http://localhost:3000
- **Dashboard**: http://localhost:18789
- **API**: http://localhost:3001/api
- **Bridge**: http://localhost:9876
