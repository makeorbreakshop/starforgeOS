---
summary: "Uninstall StarforgeOS completely (CLI, service, state, workspace)"
read_when:
  - You want to remove StarforgeOS from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

# Uninstall

Two paths:

- **Easy path** if `starforgeos` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
starforge uninstall
```

Non-interactive (automation / npx):

```bash
starforge uninstall --all --yes --non-interactive
npx -y starforge uninstall --all --yes --non-interactive
```

Manual steps (same result):

1. Stop the gateway service:

```bash
starforge gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
starforge gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${STARFORGEOS_STATE_DIR:-$HOME/.starforgeos}"
```

If you set `STARFORGEOS_CONFIG_PATH` to a custom location outside the state dir, delete that file too.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.starforgeos/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g starforgeos
pnpm remove -g starforgeos
bun remove -g starforgeos
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/StarforgeOS.app
```

Notes:

- If you used profiles (`--profile` / `STARFORGEOS_PROFILE`), repeat step 3 for each state dir (defaults are `~/.starforgeos-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `starforgeos` is missing.

### macOS (launchd)

Default label is `bot.molt.gateway` (or `bot.molt.<profile>`; legacy `com.starforgeos.*` may still exist):

```bash
launchctl bootout gui/$UID/bot.molt.gateway
rm -f ~/Library/LaunchAgents/bot.molt.gateway.plist
```

If you used a profile, replace the label and plist name with `bot.molt.<profile>`. Remove any legacy `com.starforgeos.*` plists if present.

### Linux (systemd user unit)

Default unit name is `starforgeos-gateway.service` (or `starforgeos-gateway-<profile>.service`):

```bash
systemctl --user disable --now starforgeos-gateway.service
rm -f ~/.config/systemd/user/starforgeos-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `StarforgeOS Gateway` (or `StarforgeOS Gateway (<profile>)`).
The task script lives under your state dir.

```powershell
schtasks /Delete /F /TN "StarforgeOS Gateway"
Remove-Item -Force "$env:USERPROFILE\.starforgeos\gateway.cmd"
```

If you used a profile, delete the matching task name and `~\.starforgeos-<profile>\gateway.cmd`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://starforgeos.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g starforgeos@latest`.
Remove it with `npm rm -g starforgeos` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `starforge ...` / `bun run starforge ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.
