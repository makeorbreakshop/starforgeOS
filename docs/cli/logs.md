---
summary: "CLI reference for `starforge logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `starforge logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
starforge logs
starforge logs --follow
starforge logs --json
starforge logs --limit 500
```
