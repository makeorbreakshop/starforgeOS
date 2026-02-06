---
summary: "CLI reference for `starforge voicecall` (voice-call plugin command surface)"
read_when:
  - You use the voice-call plugin and want the CLI entry points
  - You want quick examples for `voicecall call|continue|status|tail|expose`
title: "voicecall"
---

# `starforge voicecall`

`voicecall` is a plugin-provided command. It only appears if the voice-call plugin is installed and enabled.

Primary doc:

- Voice-call plugin: [Voice Call](/plugins/voice-call)

## Common commands

```bash
starforge voicecall status --call-id <id>
starforge voicecall call --to "+15555550123" --message "Hello" --mode notify
starforge voicecall continue --call-id <id> --message "Any questions?"
starforge voicecall end --call-id <id>
```

## Exposing webhooks (Tailscale)

```bash
starforge voicecall expose --mode serve
starforge voicecall expose --mode funnel
starforge voicecall unexpose
```

Security note: only expose the webhook endpoint to networks you trust. Prefer Tailscale Serve over Funnel when possible.
