# Nightly Memory Extraction

The most important automated job. Runs at 11 PM ET.

## Pipeline

1. **Extract transcripts**: `scripts/extract-transcripts.sh` pulls session logs for the day
2. **Read state**: Agent loads transcript + existing daily notes + MEMORY.md + knowledge index
3. **Categorize facts**: DECISIONS, ACTION_ITEMS, PEOPLE, PROJECTS, TECHNICAL, PREFERENCES, BUSINESS, LESSONS
4. **Route outputs**:
   - Daily notes (`memory/YYYY-MM-DD.md`)
   - Knowledge graph entities (`knowledge/`)
   - MEMORY.md (only durable operational knowledge)
5. **MEMORY.md hygiene**: Target <15K chars, move verbose details to knowledge graph
6. **Commit**: Push changes to shared-memory repo

## Transcript Script

`scripts/extract-transcripts.sh`:

- Filters by **message timestamp** (not file mod time — fixed 2026-02-08)
- Strips tool calls/results and short noise messages
- Output: `memory/transcripts/YYYY-MM-DD-transcript.md`

## Known Issues

- Agent may skim large transcripts and miss topics — needs verification step
- Python 3.10 required for Whisper (if transcribing audio)
- Apple Silicon MPS causes tensor errors — must use `device='cpu'`

## Why This Matters

Without extraction, context is lost between sessions. This pipeline is how the agent maintains continuity — converting ephemeral conversations into durable memory.
