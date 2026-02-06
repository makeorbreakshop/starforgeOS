---
summary: "CLI reference for `starforge reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `starforge reset`

Reset local config/state (keeps the CLI installed).

```bash
starforge reset
starforge reset --dry-run
starforge reset --scope config+creds+sessions --yes --non-interactive
```
