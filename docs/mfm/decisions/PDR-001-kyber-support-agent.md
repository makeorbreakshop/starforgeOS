# PDR-001: Kyber — Customer Support Co-Agent for MFM

## Status

Proposed (in progress)

## Date

2026-02-08

## Context (The Problem)

Machines for Makers gets customer questions about laser/3D printer/CNC recommendations (e.g., Sam Wechsler wanting to cut 1/8" aluminum with 24"x4" work area). Brandon answers these manually. An agent could handle common recommendation questions using knowledge from videos, website content, and material settings database.

Concern: exposing a public-facing agent to Brandon's personal email, calendar, and file system is a security risk. Ackbot (ops agent) has full access to everything — not appropriate for customer-facing work.

## What We Tried

- ❌ Ackbot handles support directly: Too much access. Personal data exposure risk. Wrong persona (tactical advisor vs helpful support).
- ❌ Skill added to Ackbot: Still runs in Ackbot's context with full tool access. No isolation.
- ✅ Separate co-agent "Kyber": Isolated knowledge base, restricted tool access, purpose-built persona for customer support.

## Decision

Build **Kyber** as a StarforgeOS co-agent with:

- **Name**: Kyber (lightsaber crystal → laser theme)
- **Knowledge base**: Separate workspace at `/Users/brandoncullum/mfm-support-kb/` with its own QMD index
- **Sources**: Video transcripts (Whisper), website content, material settings (74 files), external docs
- **Permissions**: Read-only knowledge access. No exec, no email sends without approval queue.
- **Persona**: Helpful, knowledgeable laser/maker expert. Not Ackbot's tactical advisor tone.
- **Architecture**: RAG over transcripts + site content + material settings via QMD semantic search

### Knowledge Pipeline

1. Priority videos transcribed via Whisper (turbo model, CPU, Python 3.10)
2. Website content from `/Users/brandoncullum/machines-for-makers/website_content/`
3. Material settings from 74 ingested files
4. Laser type taxonomy: diode, co2_glass, co2_rf, fiber, fiber_mopa

### Priority Videos (first batch)

- 196: 2025 Buying Guide (priority 1)
- 148: 2024 Buying Guide
- 169: Fiber Buying Guide
- 154: Desktop CO2 Comparison
- 155: Lightburn for Beginners

## Consequences

**Good:**

- Security isolation from personal data
- Purpose-built persona for customer interactions
- Scalable knowledge base (add videos, reviews, guides over time)
- Could eventually handle support email with approval queue

**Bad:**

- Separate knowledge base to maintain (won't auto-learn from Ackbot's work)
- Whisper transcription is slow on CPU (MPS/Apple Silicon has tensor bugs)
- Need to keep knowledge current as new reviews publish

## Supersedes

None — new capability.

## Related

- KB infrastructure: `/Users/brandoncullum/mfm-support-kb/`
- Video storage: `knowledge/resources/mfm-video-storage.md`
- Test case: Sam Wechsler email (fiber laser recommendation)
