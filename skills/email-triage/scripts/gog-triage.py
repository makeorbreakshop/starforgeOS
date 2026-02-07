#!/usr/bin/env python3
"""Email triage using gog CLI + Ollama for classification.

Custom version that uses gog (Google OAuth CLI) instead of IMAP.
Scans unread emails via gog, categorizes using local Ollama LLM,
and surfaces important messages.

Categories:
  🔴 urgent:         Needs immediate attention (outages, security, legal, time-sensitive)
  🟡 needs-response: Requires a reply (business inquiries, questions, action items)
  🔵 informational:  FYI only (billing, receipts, confirmations, newsletters)
  ⚫ spam:           Junk, marketing, irrelevant

Configuration (environment variables):
  GOG_ACCOUNT         Gmail account to scan (required, or use --account)
  GOG_KEYRING_PASSWORD  Keyring password for gog (required)
  EMAIL_TRIAGE_STATE  State file path (default: ~/.openclaw/workspace/data/email-triage.json)
  OLLAMA_URL          Ollama endpoint (default: http://127.0.0.1:11434)
  OLLAMA_MODEL        Model name (default: qwen2.5:3b)

Usage:
    python3 gog-triage.py scan --account brandon@makeorbreakshop.com
    python3 gog-triage.py scan --account brandonrcullum@gmail.com --verbose
    python3 gog-triage.py report
    python3 gog-triage.py mark-surfaced
    python3 gog-triage.py stats
"""

import argparse
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
GOG_PATH = os.path.expanduser("~/google-cloud-sdk/bin/gog")
GOG_ACCOUNT = os.environ.get("GOG_ACCOUNT", "")
STATE_FILE = Path(os.environ.get(
    "EMAIL_TRIAGE_STATE",
    os.path.expanduser("~/.openclaw/workspace/data/email-triage.json")
))
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen2.5:3b")

MAX_EMAILS_PER_SCAN = 20
CLASSIFICATION_TIMEOUT = 30


# ---------------------------------------------------------------------------
# gog CLI wrapper
# ---------------------------------------------------------------------------

def run_gog(args: list[str], account: str = None) -> dict | list | None:
    """Run a gog command and return parsed JSON output."""
    cmd = [GOG_PATH] + args
    if account:
        cmd.extend(["--account", account])
    cmd.append("--json")
    
    env = os.environ.copy()
    env["PATH"] = os.path.expanduser("~/google-cloud-sdk/bin") + ":" + env.get("PATH", "")
    
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            env=env
        )
        if result.returncode != 0:
            print(f"gog error: {result.stderr}", file=sys.stderr)
            return None
        return json.loads(result.stdout) if result.stdout.strip() else None
    except subprocess.TimeoutExpired:
        print("gog command timed out", file=sys.stderr)
        return None
    except json.JSONDecodeError:
        # Some commands don't return JSON
        return result.stdout if result.stdout else None


def get_unread_emails(account: str, max_results: int = 20) -> list[dict]:
    """Fetch unread emails using gog gmail messages search."""
    result = run_gog([
        "gmail", "messages", "search",
        "is:unread in:inbox",
        "--max", str(max_results)
    ], account)
    
    if not result:
        return []
    
    # gog returns {"messages": [...]} or just a list
    if isinstance(result, dict) and "messages" in result:
        return result["messages"]
    elif isinstance(result, list):
        return result
    
    return []


def get_email_details(account: str, message_id: str) -> dict | None:
    """Get full email details by message ID."""
    result = run_gog([
        "gmail", "messages", "get",
        message_id
    ], account)
    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_email_key(msg_id: str, subject: str, sender: str) -> str:
    """Create a stable key for deduplication."""
    if msg_id:
        return msg_id.strip()
    combo = f"{subject}|{sender}"
    return hashlib.sha256(combo.encode()).hexdigest()[:16]


# ---------------------------------------------------------------------------
# State management
# ---------------------------------------------------------------------------

def load_state() -> dict:
    """Load triage state from disk."""
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE) as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {"last_check": None, "emails": {}}


def save_state(state: dict):
    """Write triage state to disk."""
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    state["last_check"] = datetime.now(timezone.utc).isoformat()
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------

def classify_with_ollama(sender: str, subject: str, preview: str) -> tuple[str, str]:
    """Classify an email using local Ollama LLM."""
    import urllib.request

    prompt = f"""Classify this email into exactly one category. Reply with ONLY a JSON object, no other text.

Categories:
- "urgent": Server outages, security alerts, legal notices, payment failures, time-critical action needed
- "needs-response": Business inquiries, questions requiring answers, partnership proposals, support requests from real people
- "informational": Billing statements, receipts, confirmations, newsletters, status updates, automated notifications
- "spam": Marketing, promotions, unsolicited sales, irrelevant mass emails

Email:
From: {sender}
Subject: {subject}
Preview: {preview[:300]}

Reply format: {{"category": "<category>", "reason": "<brief reason>"}}"""

    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 100,
        },
    }).encode()

    try:
        req = urllib.request.Request(
            f"{OLLAMA_URL}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=CLASSIFICATION_TIMEOUT) as resp:
            result = json.loads(resp.read())
            response_text = result.get("response", "").strip()

            # Parse JSON from response (handle markdown fences)
            if "```" in response_text:
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            parsed = json.loads(response_text)
            category = parsed.get("category", "informational").lower()
            reason = parsed.get("reason", "LLM classification")

            valid = {"urgent", "needs-response", "informational", "spam"}
            if category not in valid:
                category = "informational"

            return category, f"[ollama] {reason}"

    except Exception as e:
        # Ollama unavailable — fall back to heuristics
        return classify_heuristic(sender, subject, preview)


def classify_heuristic(sender: str, subject: str, preview: str) -> tuple[str, str]:
    """Rule-based fallback classification when Ollama is unavailable."""
    sender_lower = sender.lower()
    subject_lower = subject.lower()
    combined = f"{subject_lower} {preview.lower()}"

    # Urgent patterns
    urgent_keywords = [
        "outage", "down", "critical", "security alert", "breach",
        "suspended", "terminated", "legal notice", "court",
        "payment failed", "overdue", "final notice", "action required",
        "account locked", "verify your", "unusual activity",
    ]
    if any(kw in combined for kw in urgent_keywords):
        return "urgent", "[heuristic] Matched urgent keywords"

    # Spam/marketing patterns
    spam_patterns = [
        "unsubscribe", "opt out", "special offer", "limited time",
        "click here", "act now", "congratulations", "you've won",
        "free trial", "exclusive deal", "% off", "sale ends",
        "order now", "buy now", "discount code",
    ]
    spam_senders = ["noreply@", "marketing@", "promo@", "newsletter@", "deals@", "offers@"]
    if any(p in combined for p in spam_patterns) or any(s in sender_lower for s in spam_senders):
        return "spam", "[heuristic] Marketing/promotional pattern"

    # Informational patterns (automated notifications)
    info_patterns = [
        "receipt", "confirmation", "your order", "shipping",
        "has shipped", "delivered", "tracking", "invoice",
        "statement", "notification", "alert", "automated",
        "do not reply", "noreply", "no-reply",
    ]
    if any(p in combined for p in info_patterns):
        return "informational", "[heuristic] Automated notification pattern"

    # Needs-response patterns
    response_patterns = [
        "question", "inquiry", "proposal", "partnership",
        "following up", "can you", "would you", "could you",
        "please review", "feedback", "meeting", "schedule",
        "let me know", "get back to", "your thoughts",
    ]
    if any(p in combined for p in response_patterns):
        return "needs-response", "[heuristic] Appears to need a reply"

    return "informational", "[heuristic] Default classification"


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def scan_emails(account: str, dry_run: bool = False, verbose: bool = False) -> dict:
    """Scan Gmail for unread emails and classify them."""
    if not account:
        print("ERROR: No account specified. Use --account or set GOG_ACCOUNT", file=sys.stderr)
        sys.exit(1)
    
    state = load_state()
    
    if verbose:
        print(f"Scanning {account}...")
    
    emails = get_unread_emails(account, MAX_EMAILS_PER_SCAN)
    
    if not emails:
        if verbose:
            print("No unread emails found.")
        return {"new": 0, "total_unread": 0, "account": account}
    
    new_count = 0
    for email_data in emails:
        msg_id = email_data.get("id", "")
        subject = email_data.get("subject", "(no subject)")
        sender = email_data.get("from", "")
        snippet = email_data.get("snippet", "")
        date_str = email_data.get("date", datetime.now(timezone.utc).isoformat())
        
        key = make_email_key(msg_id, subject, sender)
        
        # Skip if already triaged
        if key in state["emails"]:
            if verbose:
                print(f"  [skip] {subject[:50]}... (already triaged)")
            continue
        
        # Classify
        category, reason = classify_with_ollama(sender, subject, snippet)
        new_count += 1
        
        entry = {
            "id": msg_id,
            "subject": subject,
            "from": sender,
            "date": date_str,
            "snippet": snippet[:200],
            "category": category,
            "reason": reason,
            "account": account,
            "surfaced": False,
            "triaged_at": datetime.now(timezone.utc).isoformat(),
        }
        
        if verbose:
            icon = {"urgent": "🔴", "needs-response": "🟡", "informational": "🔵", "spam": "⚫"}.get(category, "⚪")
            print(f"  {icon} [{category}] {subject[:50]}...")
            print(f"     From: {sender}")
            print(f"     Reason: {reason}")
        
        if not dry_run:
            state["emails"][key] = entry
    
    if not dry_run:
        # Prune old entries (keep last 500)
        if len(state["emails"]) > 500:
            sorted_keys = sorted(
                state["emails"].keys(),
                key=lambda k: state["emails"][k].get("triaged_at", ""),
                reverse=True,
            )
            state["emails"] = {k: state["emails"][k] for k in sorted_keys[:500]}
        save_state(state)
    
    result = {
        "new": new_count,
        "total_unread": len(emails),
        "account": account,
    }
    
    if verbose:
        print(f"\nScanned {len(emails)} emails, {new_count} newly triaged.")
    
    return result


def report(as_json: bool = False, account: str = None) -> list[dict]:
    """Report unsurfaced important emails (urgent + needs-response)."""
    state = load_state()
    important = []

    for key, entry in state["emails"].items():
        if entry.get("surfaced"):
            continue
        if account and entry.get("account") != account:
            continue
        if entry["category"] in ("urgent", "needs-response"):
            important.append({"key": key, **entry})

    # Sort by priority (urgent first), then by date
    priority_order = {"urgent": 0, "needs-response": 1}
    important.sort(key=lambda e: (priority_order.get(e["category"], 9), e.get("date", "")))

    if as_json:
        print(json.dumps({"count": len(important), "emails": important}, indent=2))
    else:
        if not important:
            print("✅ No important unsurfaced emails.")
        else:
            print(f"📬 {len(important)} email(s) needing attention:\n")
            for e in important:
                icon = "🔴" if e["category"] == "urgent" else "🟡"
                acct = e.get("account", "").split("@")[0]
                print(f"  {icon} [{acct}] {e['subject']}")
                print(f"     From: {e['from']}")
                print(f"     {e['reason']}")
                print()

    return important


def mark_surfaced():
    """Mark all important emails as surfaced after they've been reported."""
    state = load_state()
    count = 0
    for key, entry in state["emails"].items():
        if not entry.get("surfaced") and entry["category"] in ("urgent", "needs-response"):
            entry["surfaced"] = True
            count += 1
    save_state(state)
    print(f"Marked {count} email(s) as surfaced.")


def stats():
    """Show triage statistics."""
    state = load_state()
    categories = {"urgent": 0, "needs-response": 0, "informational": 0, "spam": 0}
    unsurfaced = {"urgent": 0, "needs-response": 0}
    by_account = {}

    for entry in state["emails"].values():
        cat = entry.get("category", "informational")
        categories[cat] = categories.get(cat, 0) + 1
        if not entry.get("surfaced") and cat in unsurfaced:
            unsurfaced[cat] += 1
        acct = entry.get("account", "unknown")
        by_account[acct] = by_account.get(acct, 0) + 1

    print("📊 Email Triage Stats")
    print(f"  Last check: {state.get('last_check', 'never')}")
    print(f"  Total triaged: {len(state['emails'])}")
    print("\n  By category:")
    for cat, count in categories.items():
        icon = {"urgent": "🔴", "needs-response": "🟡", "informational": "🔵", "spam": "⚫"}.get(cat, "⚪")
        print(f"    {icon} {cat}: {count}")
    print("\n  Unsurfaced important:")
    print(f"    🔴 urgent: {unsurfaced['urgent']}")
    print(f"    🟡 needs-response: {unsurfaced['needs-response']}")
    print("\n  By account:")
    for acct, count in by_account.items():
        print(f"    {acct}: {count}")


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Email triage using gog + Ollama")
    parser.add_argument(
        "command",
        choices=["scan", "report", "mark-surfaced", "stats"],
        help="Command to run",
    )
    parser.add_argument("--account", "-a", default=GOG_ACCOUNT, help="Gmail account to use")
    parser.add_argument("--dry-run", action="store_true", help="Scan without saving state")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    args = parser.parse_args()

    if args.command == "scan":
        result = scan_emails(args.account, dry_run=args.dry_run, verbose=args.verbose or args.dry_run)
        if args.json:
            print(json.dumps(result, indent=2))
    elif args.command == "report":
        report(as_json=args.json, account=args.account if args.account else None)
    elif args.command == "mark-surfaced":
        mark_surfaced()
    elif args.command == "stats":
        stats()


if __name__ == "__main__":
    main()
