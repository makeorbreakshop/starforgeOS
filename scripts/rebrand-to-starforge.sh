#!/bin/bash
set -euo pipefail

# StarforgeOS Rebranding Script
# Converts all StarforgeOS references to StarforgeOS

echo "Starting rebranding from StarforgeOS to StarforgeOS..."

# Define the root directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Files to process (excluding node_modules, vendor, .git)
find_files() {
  find . \
    -type f \
    \( -name "*.md" -o -name "*.json" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/vendor/*" \
    -not -path "*/.git/*" \
    -not -path "*/dist/*"
}

# Count total files to process
TOTAL_FILES=$(find_files | wc -l | tr -d ' ')
echo "Found $TOTAL_FILES files to process"

# Rebranding patterns
# Priority order matters - do specific replacements before general ones

echo "Applying rebranding transformations..."

# 1. GitHub URLs: starforgeos/starforge → makeorbreakshop/starforgeOS
find_files | xargs sed -i.bak 's|github\.com/starforgeos/starforgeos|github.com/makeorbreakshop/starforgeOS|g'
find_files | xargs sed -i.bak 's|starforgeos\.github\.io|makeorbreakshop.github.io|g'

# 2. Domain URLs (keep docs.starforgeos.ai as per instructions)
# No changes needed for docs.starforgeos.ai

# 3. Package names and npm references
find_files | xargs sed -i.bak 's/"starforgeos"/"starforgeos"/g'
find_files | xargs sed -i.bak "s/'starforgeos'/'starforgeos'/g"

# 4. CLI commands with space after: "starforge " → "starforge "
find_files | xargs sed -i.bak 's/starforge /starforge /g'

# 5. Product name: StarforgeOS → StarforgeOS (preserve capitalization)
find_files | xargs sed -i.bak 's/StarforgeOS/StarforgeOS/g'

# 6. Lowercase references (but not package names already handled)
# Be careful not to double-replace
find_files | xargs sed -i.bak 's/\bopenclaw\b/starforgeos/g'

# 7. Special case: starforgeos.ai domain references
find_files | xargs sed -i.bak 's/https:\/\/starforgeos\.ai/https:\/\/starforgeos.ai/g'
find_files | xargs sed -i.bak 's/http:\/\/starforgeos\.ai/http:\/\/starforgeos.ai/g'

# 8. Discord/community references
find_files | xargs sed -i.bak 's/discord\.gg\/clawd/discord.gg/starforge/g'

# Clean up backup files
echo "Cleaning up backup files..."
find . -name "*.bak" -not -path "*/node_modules/*" -not -path "*/vendor/*" -delete

echo "✓ Rebranding complete!"
echo ""
echo "Next steps:"
echo "1. Review changes with: git diff"
echo "2. Test the application"
echo "3. Commit changes: git add -A && git commit -m 'Rebrand StarforgeOS to StarforgeOS'"
