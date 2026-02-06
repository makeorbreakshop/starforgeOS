#!/usr/bin/env python3
"""
StarforgeOS Rebranding Script
Converts all OpenClaw references to StarforgeOS with precise control
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

# Root directory
ROOT_DIR = Path(__file__).parent.parent

# Rebranding rules (order matters - more specific first)
REPLACEMENTS = [
    # GitHub URLs
    (r'github\.com/openclaw/openclaw', 'github.com/makeorbreakshop/starforgeOS'),
    (r'openclaw\.github\.io', 'makeorbreakshop.github.io'),

    # Domains (keep docs.openclaw.ai unchanged as per instructions)
    (r'https://openclaw\.ai', 'https://starforgeos.ai'),
    (r'http://openclaw\.ai', 'http://starforgeos.ai'),
    (r'\bopenclaw\.ai\b', 'starforgeos.ai'),

    # Discord
    (r'discord\.gg/clawd', 'discord.gg/starforge'),

    # CLI command with space: "openclaw " → "starforge "
    (r'\bopenclaw ', 'starforge '),

    # Package names in JSON (quoted)
    (r'"openclaw"', '"starforgeos"'),
    (r"'openclaw'", "'starforgeos'"),

    # Product name: OpenClaw → StarforgeOS
    (r'\bOpenClaw\b', 'StarforgeOS'),

    # Lowercase in code/paths (but preserve after @ for npm scopes)
    (r'(?<!@)\bopenclaw\b', 'starforgeos'),
]

def should_process_file(filepath: Path) -> bool:
    """Determine if a file should be processed"""
    # Exclude patterns
    exclude_dirs = {'node_modules', 'vendor', '.git', 'dist', '__pycache__'}
    exclude_extensions = {'.pyc', '.pyo', '.so', '.dylib', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg'}

    # Check if any parent is in exclude_dirs
    if any(part in exclude_dirs for part in filepath.parts):
        return False

    # Check extension
    if filepath.suffix in exclude_extensions:
        return False

    # Only process text files
    include_extensions = {'.md', '.json', '.ts', '.tsx', '.js', '.jsx', '.txt', '.yaml', '.yml', '.sh'}
    return filepath.suffix in include_extensions or filepath.suffix == ''

def rebrand_file(filepath: Path) -> Tuple[bool, int]:
    """
    Rebrand a single file
    Returns: (changed, num_replacements)
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except (UnicodeDecodeError, IsADirectoryError):
        return False, 0

    original_content = content
    total_replacements = 0

    # Apply all replacements
    for pattern, replacement in REPLACEMENTS:
        content, n = re.subn(pattern, replacement, content)
        total_replacements += n

    # Only write if changed
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True, total_replacements

    return False, 0

def main():
    """Main rebranding function"""
    print("🔧 StarforgeOS Rebranding Script")
    print("=" * 60)

    # Find all files
    all_files = []
    for root, dirs, files in os.walk(ROOT_DIR):
        # Filter out excluded directories
        dirs[:] = [d for d in dirs if d not in {'node_modules', 'vendor', '.git', 'dist', '__pycache__'}]

        for file in files:
            filepath = Path(root) / file
            if should_process_file(filepath):
                all_files.append(filepath)

    print(f"📁 Found {len(all_files)} files to process\n")

    # Process files
    changed_files = []
    total_replacements = 0

    for i, filepath in enumerate(all_files, 1):
        if i % 100 == 0:
            print(f"   Processing {i}/{len(all_files)}...")

        changed, n_replacements = rebrand_file(filepath)
        if changed:
            changed_files.append((filepath, n_replacements))
            total_replacements += n_replacements

    # Report results
    print("\n" + "=" * 60)
    print(f"✅ Rebranding complete!")
    print(f"   Files changed: {len(changed_files)}")
    print(f"   Total replacements: {total_replacements}")

    if changed_files:
        print("\n📝 Changed files (showing first 20):")
        for filepath, n in sorted(changed_files, key=lambda x: -x[1])[:20]:
            rel_path = filepath.relative_to(ROOT_DIR)
            print(f"   {rel_path}: {n} changes")

    print("\n🚀 Next steps:")
    print("   1. Review changes: git diff")
    print("   2. Add migration note to README.md")
    print("   3. Test the application")
    print("   4. Commit: git add -A && git commit -m 'Rebrand to StarforgeOS'")

if __name__ == '__main__':
    main()
