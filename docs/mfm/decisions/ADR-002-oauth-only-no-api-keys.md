# ADR-002: OAuth Only — No Raw API Keys in Configs

## Status

Active

## Date

2026-02-08

## Context (The Problem)

StarforgeOS config (`starforge.json`) had `auth.profiles` set to `mode: "token"` for both Anthropic providers. The token was an OAuth session token from the Claude Max subscription, but the config didn't distinguish it from a paid API key. When agentTurn sessions used it, they hit billing errors — suggesting the token was treated as an API key by the Anthropic API.

Brandon: "We only do oauth. Nothing in our starforge or lobot openclaw should have an openai or anthropic api key."

Additionally, the logging `redactPatterns` didn't include OpenAI (`sk-proj-`) or Anthropic (`sk-ant-`) API key patterns — meaning if one leaked into logs, it wouldn't be caught.

## What We Tried

- ❌ Token mode with costs set to 0: Ambiguous — token could be OAuth or API key. Billing errors proved the API treated it as a paid key.
- ✅ OAuth via Claude Max subscription: Main session already uses this. Claude Code CLI (`claude -p`) uses it. Codex uses it. All free under the $200/month plan.

## Decision

1. **Auth must be OAuth** — no raw `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` anywhere in starforge or openclaw configs on either machine (Mac Studio or Mac Mini)
2. **Logging redactPatterns updated** — added `sk-ant-`, `sk-proj-`, and generic `sk-` patterns to catch any API keys that leak into session logs
3. **Nightly security audit** must check both machines for API key exposure
4. **Cron jobs use systemEvent** (ADR-001) to avoid the token auth path entirely

## Consequences

**Good:**

- Zero API costs — everything covered by Claude Max subscription
- No risk of accidental API key exposure in logs (redactPatterns catch them)
- Nightly audit enforces the policy across both machines
- Clear security posture: OAuth only, period

**Bad:**

- Rate limits from Max subscription apply (vs dedicated API key with higher limits)
- If Max subscription lapses, everything stops (single point of dependency)

## Supersedes

None — this formalizes what was already the intent but wasn't enforced.

## Related

- ADR-001: Cron jobs via systemEvent + Codex CLI
- Security audit script: `~/.openclaw/workspace/scripts/security-audit.sh`
- MEMORY.md: "Auth is OAuth only" behavioral lesson
