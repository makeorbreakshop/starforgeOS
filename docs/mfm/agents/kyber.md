# Kyber ⚡ (Planned)

## Identity

- **Name**: Kyber (lightsaber crystal — laser theme connection)
- **Role**: Customer support co-agent for Machines for Makers
- **Status**: In development

## Purpose

Answer laser/3D printer/CNC recommendation questions from the public, using knowledge from Brandon's video library, website content, and material settings database.

## Knowledge Base

- **Location**: `/Users/brandoncullum/mfm-support-kb/`
- **Isolated** from personal data (Ackbot/Lobot memory)
- **Sources**:
  - Video transcripts (~140 videos, 5 priority transcripts done)
  - Website content (`machines-for-makers/website_content/`)
  - Material settings (74 files)
  - Laser type taxonomy: diode, co2_glass, co2_rf, fiber, fiber_mopa
- **Search**: Separate QMD index at `mfm-support-kb/.qmd/`

## Permissions (Locked Down)

- ✅ Read-only on knowledge base
- ❌ No exec
- ❌ No email sends without approval queue
- ❌ No access to personal email/calendar
- ❌ No shared-memory access

## Architecture Decisions

- Co-agent over skill/Ackbot for security isolation
- RAG approach: semantic search over transcripts, site content, material settings
- Separate QMD index (not shared with Ackbot's workspace)
- Purpose-built persona (helpful support tone, not tactical advisor)

## Progress

- [x] KB infrastructure built (AGENTS.md, SOUL.md, scripts, configs)
- [x] 5 priority video transcriptions completed
- [x] Whisper pipeline working (turbo model, CPU, Python 3.10)
- [ ] `agents.list` entry with restricted tool policies
- [ ] QMD index populated
- [ ] Test against Sam Wechsler email (fiber laser recommendation)
- [ ] Dedicated support email address

## Test Case

Sam Wechsler: wants to cut 1/8" aluminum, engrave 1/16" aluminum, needs 24"x4" work area.
→ Fiber laser required, desktop fibers have ~4"x4" work area, his requirements need full-size fiber ($5K+) or CNC router/plasma.

See: [PDR-001-kyber-support-agent.md](../decisions/PDR-001-kyber-support-agent.md)
