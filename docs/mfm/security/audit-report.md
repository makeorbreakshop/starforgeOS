# Security Audit — OpenClaw Workspace

Date: 2026-02-05

## Secret Scrub Findings

- [ ] **scripts/gmail-filter-proxy.py:29** — Hardcoded `OPENCLAW_HOOK_TOKEN` (OpenClaw hook auth token). This is a live credential in source control.
- [ ] **/Users/brandoncullum/Library/LaunchAgents/ai.openclaw.gmail-filter.plist:22-23** — `GOG_WEBHOOK_TOKEN` stored in plaintext in a LaunchAgent (world-readable file).
- [ ] **/Users/brandoncullum/Library/LaunchAgents/ai.openclaw.gmail-personal.plist:21-26, 35-36** — `--token`, `--hook-token`, and `GOG_KEYRING_PASSWORD` stored in plaintext (world-readable file).
- [ ] **/Users/brandoncullum/Library/LaunchAgents/ai.openclaw.gmail-work.plist:21-26, 35-36** — `--token`, `--hook-token`, and `GOG_KEYRING_PASSWORD` stored in plaintext (world-readable file).

**Git history check:** `git log --all -p` contains the same hardcoded `OPENCLAW_HOOK_TOKEN` line, so the secret is present in history and would need rotation + history rewrite if you want a clean slate.

## Security Vulnerabilities Found

- [ ] **High — scripts/gmail-filter-proxy.py:29** — Secret in source (`OPENCLAW_HOOK_TOKEN`).
  - **Risk:** Anyone with repo access can call the OpenClaw hook.
  - **Fix:** Move to `.env` (or Keychain/1Password), load via `os.environ`, rotate the token, and purge from git history.

- [ ] **High — /Users/brandoncullum/Library/LaunchAgents/ai.openclaw.gmail-\*.plist:21-26, 35-36** — Secrets stored as plaintext in world-readable LaunchAgent plists.
  - **Risk:** Any local user can read tokens + GOG keyring password.
  - **Fix:** Move secrets to Keychain and load via `security find-generic-password`, or set permissions to `600` at minimum; rotate tokens after moving.

- [ ] **Medium — scripts/gmail-filter-proxy.py:246-266** — Webhook auth is optional; if `GOG_WEBHOOK_TOKEN` is unset, the proxy accepts any POST.
  - **Risk:** If bound to non-localhost or port forwarded, unauthenticated webhook injection is possible.
  - **Fix:** Make token mandatory, fail-fast if missing; keep bind to `127.0.0.1` and avoid exposure.

- [ ] **Low — scripts/daily-metrics-snapshot.py:134-241 + 420-474** — SQL is assembled with f-strings using `snapshot_date` from argv.
  - **Risk:** If invoked with untrusted input, this is SQL-injection-prone.
  - **Fix:** Validate date format (`YYYY-MM-DD`) before use or switch to parameterized queries.

- [ ] **Low — scripts/extract-transcripts.sh:8-78** — `DATE` is interpolated into a Python `-c` string and output path without strict validation.
  - **Risk:** Malformed input could break the Python snippet or write outside the intended directory.
  - **Fix:** Validate `DATE` against a strict regex and/or pass via env/argv to the Python script instead of inline string interpolation.

- [ ] **Low — .env permissions** — `.env` is `644` (world-readable).
  - **Risk:** Local users can read all API keys.
  - **Fix:** `chmod 600 .env` and limit ownership to the current user.

- [ ] **Low — data/gmail-filter.log (not gitignored)** — Email metadata is logged to a repo file that is world-readable and not ignored.
  - **Risk:** Accidental commit of PII, local disclosure.
  - **Fix:** Add `data/*.log` to `.gitignore`, rotate logs, set permissions to `600` if kept.

## Things That Look Good

- [ ] `.gitignore` explicitly excludes `.env`, `memory/credentials.md`, and transcript/large data files.
- [ ] No private keys or DB connection strings were found in tracked files.
- [ ] Most credentials are referenced by env var names rather than being hardcoded (except the hook token noted above).
- [ ] Gmail filter proxy binds to `127.0.0.1` by default, reducing remote exposure risk.

## Overall Risk Assessment

**High** due to live tokens stored in source control and world-readable LaunchAgent plists. Immediate rotation + secret relocation is recommended. The remaining issues are low-to-medium hardening items that can be fixed incrementally once secrets are secured.
