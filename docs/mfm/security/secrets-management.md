# Secrets Management

## Where Secrets Live

| Location                | What                            | Access                      |
| ----------------------- | ------------------------------- | --------------------------- |
| `.env` (workspace root) | API keys, DB URLs, tokens       | `chmod 600`, gitignored     |
| 1Password (vault: MOBS) | Long-term storage               | Service account in Keychain |
| macOS Keychain          | 1Password service account token | `security` CLI              |

## Hard Rules

1. **Never put secrets in**: Markdown files, scripts, commit messages, daily notes
2. **Never echo/print secrets**: Outputs go to session logs → transcripts → potential leaks
3. **Never generate passwords**: They end up in logs; Brandon generates locally
4. **Scripts load from env**: `os.environ[]` (Python) or `source .env` (bash)

## 1Password Access

```bash
export OP_SERVICE_ACCOUNT_TOKEN=$(security find-generic-password -a "ackbot" -s "1password-service-account" -w)
op item list --vault MOBS
op item get "Item Name" --vault MOBS --fields label1,label2
```

## Defense Layers

1. Don't print secrets (this rule)
2. `scripts/scrub-secrets.sh` runs nightly before commits
3. Pre-commit hook blocks obvious patterns
4. Transcripts are gitignored
5. Nightly security audit scans for leaked keys
