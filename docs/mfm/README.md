# System Documentation

Documentation for the StarforgeOS agent system powering Machines for Makers operations.

## Structure

```
docs/
├── README.md                    ← You are here
├── architecture/
│   ├── overview.md              ← High-level system diagram & hardware
│   ├── sessions.md              ← Session types, routing, compaction
│   ├── starforge-tools.md       ← Document editor with @mentions
│   └── data-flow.md             ← How data moves through the system
├── agents/
│   ├── ackbot.md                ← Chief of Staff (Mac Studio)
│   ├── lobot.md                 ← Secondary agent (Mac Mini)
│   └── kyber.md                 ← Customer support co-agent (planned)
├── automation/
│   ├── cron-jobs.md             ← All scheduled jobs, schedules, what they do
│   ├── launchagents.md          ← macOS LaunchAgent services
│   ├── price-extractor.md       ← Nightly price tracking pipeline
│   └── coding-workflow.md       ← Codex CLI delegation model
├── memory/
│   ├── system.md                ← Three-layer memory architecture
│   ├── knowledge-graph.md       ← PARA structure, entity format, QMD search
│   └── extraction-pipeline.md   ← Nightly transcript → daily notes → MEMORY.md
├── integrations/
│   ├── discord.md               ← Channels, sessions, webhooks
│   ├── gmail.md                 ← Pub/Sub, filter proxy, triage rules
│   ├── agentmail.md             ← Webhook + polling fallback
│   ├── imessage.md              ← BlueBubbles relay
│   ├── data-sources.md          ← Supabase, PostHog, Stripe, GA, YouTube, ConvertKit
│   └── tailscale.md             ← Network mesh, SSH, ACLs
├── security/
│   ├── auth-model.md            ← OAuth only, no raw API keys
│   ├── secrets-management.md    ← .env, 1Password, Keychain
│   ├── prompt-injection.md      ← Defense rules, input sanitizer
│   └── nightly-audit.md         ← What the security audit checks
├── operations/
│   ├── monitoring.md            ← Health checks, alert scripts, #monitoring
│   └── skills.md                ← Installed skills, how they work
└── decisions/
    ├── template.md
    ├── ADR-001-cron-systemEvent-codex.md
    ├── ADR-002-oauth-only-no-api-keys.md
    ├── ADR-003-dual-agent-architecture.md
    ├── ADR-004-memory-extraction-pipeline.md
    ├── ADR-005-security-guardrails.md
    ├── PDR-001-kyber-support-agent.md
    └── PDR-002-seo-overnight-priority.md
```

## Conventions

- **ADR** = Architecture Decision Record (technical decisions)
- **PDR** = Product Decision Record (product/business decisions)
- Each doc is self-contained — read any file independently
- Cross-reference with `[link text](relative/path.md)` between docs
- Keep files focused — if a section grows past ~200 lines, split it
