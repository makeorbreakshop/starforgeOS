# Tailscale Network

Mesh VPN connecting all devices.

## Tailnet

- **Domain**: `tail1e8b7c.ts.net`
- **All devices**: Running brew tailscaled (not App Store)

## Devices

| Hostname               | IP             | Tags           | Notes          |
| ---------------------- | -------------- | -------------- | -------------- |
| macstudio-2            | 100.95.106.45  | tag:mac-studio | Ackbot, SSH ✅ |
| lobots-mac-mini        | 100.94.86.43   | tag:mac-mini   | Lobot, SSH ✅  |
| brandons-macbook-pro-1 | 100.99.212.120 | tag:macbook    | SSH ✅         |
| familyhub-nas          | 100.87.124.19  | tag:nas        | SSH ✅         |
| iphone-14-pro          | 100.104.72.5   | brandon@       | No SSH         |

## SSH Access

All tagged devices can SSH to each other. Member devices (iPhone) can SSH to tagged + own devices.

## ACL Lessons

- SSH `dst` cannot have user emails when `src` is a tag
- `autogroup:member` does NOT work in SSH `dst`
- Solution: tag ALL devices that need to be SSH targets
- After tagging: may need `tailscale logout && tailscale up --advertise-tags=tag:X --ssh` + re-auth

## Funnel

Tailscale Funnel used for Gmail Pub/Sub webhook endpoints.

## Reference

ACL policy saved at: `memory/tailscale-acl-policy.json`
Parsec also available for GUI remote access.
