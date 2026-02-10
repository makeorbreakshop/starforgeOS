---
name: claude-websearch
description: Search the web using Claude Code's native WebSearch. Use when you need web search results but don't have a Brave API key configured. Invoked via /websearch <query>.
user-invocable: true
metadata: { "openclaw": { "requires": { "bins": ["claude"] }, "emoji": "🔍" } }
---

# Claude Code WebSearch

Shells out to Claude Code CLI for web searches using native WebSearch tool.

## Usage

User invokes: `/websearch <query>`

## Implementation

**Important:** Web search takes 15-30 seconds. Use file output and wait for completion.

```bash
# Run search with JSON output to capture session_id
claude -p "Search the web for: {query}. Return the top 5 results with titles, URLs, and brief descriptions." \
  --allowedTools "WebSearch" \
  --output-format json \
  > /tmp/websearch-result.json 2>&1

# Wait for process to complete (may take 15-30s)
# Then read result
cat /tmp/websearch-result.json | jq -r '.result'
```

## Session Persistence (Optional)

For follow-up searches with context, capture and reuse session_id:

```bash
# First search - get session_id
session_id=$(cat /tmp/websearch-result.json | jq -r '.session_id')

# Follow-up search in same session
claude -p "Tell me more about result #2" \
  --resume "$session_id" \
  --allowedTools "WebSearch" \
  --output-format json
```

## Notes

- Takes 15-30 seconds (don't kill early!)
- Uses Claude subscription tokens (no Brave API key needed)
- `--output-format json` returns structured data with session_id
- Store session_id in `/tmp/websearch-session.txt` for multi-turn research
