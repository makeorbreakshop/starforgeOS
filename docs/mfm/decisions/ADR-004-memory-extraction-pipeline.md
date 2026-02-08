# ADR-004: Memory Extraction Pipeline (Transcript → Daily Notes → MEMORY.md)

## Status

Active

## Date

2026-02-08

## Context (The Problem)

Agents wake up fresh each session with no memory of prior conversations. We need a reliable system to capture decisions, context, and lessons from daily work and make them available to future sessions.

The initial implementation had two critical bugs discovered 2026-02-08:

1. Transcript script used `find -newermt` (file modification time) to select session files — sessions spanning multiple days got attributed to wrong dates or missed entirely
2. Feeding a 2MB transcript to an LLM and asking it to extract everything was unreliable — it skimmed and missed the entire price extractor discussion from Feb 6

## What We Tried

- ❌ File mod time filtering (`find -newermt`): Sessions that span midnight get attributed to wrong day. Feb 6 transcript was completely missing.
- ❌ Single-pass LLM extraction on 2MB transcript: Skimmed, missed topics. No verification.
- ✅ Message timestamp filtering: Parse JSONL, check each message's timestamp, bucket to correct date. Recovered Feb 6 (372K chars, 28 sessions). Cleaned Feb 7 (2.1MB → 253KB).

## Decision

Three-layer memory system:

1. **Daily notes** (`memory/YYYY-MM-DD.md`): Raw log of what happened. Created during the day via pre-compaction flushes and nightly extraction.
2. **MEMORY.md**: Curated long-term knowledge. Target <15K chars. Quick reference card, not encyclopedia. Pointers to knowledge graph for details.
3. **Knowledge graph** (`knowledge/`): Full documentation. Entities, projects, resources. Indexed by QMD for semantic search.

Nightly extraction (11pm ET):

1. `extract-transcripts.sh` generates day's transcript (filters by message timestamp)
2. Main session (Opus 4.6) reads transcript, cross-references with existing memory
3. Routes extractions to daily notes, knowledge graph, MEMORY.md
4. MEMORY.md hygiene: prune, deduplicate, move verbose details to knowledge graph

## Consequences

**Good:**

- Message timestamp filtering ensures no missed days or cross-contamination
- Three-layer system separates raw events from curated knowledge
- QMD indexing enables semantic search across all memory
- Main session extraction has full context from the day's work

**Bad:**

- Large transcripts still challenge extraction quality (need to chunk or prioritize)
- Extraction runs in main session, adding to context window
- No automated verification that all important topics were captured (TODO)

## Supersedes

Original extraction used file mod time filtering (broken). Fixed 2026-02-08.

## Related

- Script: `scripts/extract-transcripts.sh`
- ADR-001: Memory extraction now runs as systemEvent in main session
- HEARTBEAT.md: QMD index maintenance
