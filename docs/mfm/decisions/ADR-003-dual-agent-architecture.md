# ADR-003: Dual-Agent Architecture (Ackbot + Lobot)

## Status

Active

## Date

2026-02-06

## Context (The Problem)

Brandon runs two Macs: a Mac Studio (primary workstation) and a Mac Mini (secondary/home server). He needed agent coverage on both machines with different responsibilities — business ops on the Studio, personal/home automation on the Mini. Single-gateway multi-agent was considered but rejected for isolation and redundancy.

## What We Tried

- ❌ Single gateway, multiple agents: StarforgeOS supports this, but it would mean both agents share a machine. If it goes down, everything goes down. Also mixes personal and business contexts.
- ✅ Two separate gateways on two machines: True redundancy. Ackbot (Mac Studio) handles business/MFM. Lobot (Mac Mini) handles personal/home. Each has its own StarforgeOS instance.

## Decision

- **Ackbot** (Mac Studio): Chief of Staff. Business ops, MFM, development, monitoring.
- **Lobot** (Mac Mini): Personal agent. Home automation, family dashboard, personal email.
- **Shared memory**: Git repo (`makeorbreakshop/shared-memory`) syncs every 5 minutes between machines.
- **Single-writer extraction**: Only Ackbot runs nightly memory extraction (pulls Lobot sessions via SSH). Prevents merge conflicts.
- **Tailscale**: Connects both machines. Lobot at `100.94.86.43`, SSH user `lobot`.

## Consequences

**Good:**

- True redundancy — if one machine is down, the other still works
- Clean separation of business vs personal contexts
- Shared memory keeps both agents aware of each other's work
- Lobot can run home automation without touching business data

**Bad:**

- Two configs to maintain and audit
- SSH dependency for cross-machine session extraction
- Shared memory sync can lag up to 5 minutes
- Have to remember which agent handles what

## Supersedes

None — initial architecture decision.

## Related

- Tailscale network: `knowledge/resources/tailscale-network.md`
- Shared memory repo: `makeorbreakshop/shared-memory`
