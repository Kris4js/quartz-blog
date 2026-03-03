#!/bin/bash

# Quick Publish - For rapid content updates
# Automatically generates commit message based on changed files

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get list of changed markdown files
MD_FILES=$(git diff --name-only --cached --diff-filter=ACMR | grep '\.md$' || true)
MD_FILES_UNSTAGED=$(git diff --name-only --diff-filter=ACMR | grep '\.md$' || true)
MD_FILES_UNTRACKED=$(git ls-files --others --exclude-standard | grep '\.md$' || true)

# Build commit message
COMMIT_MSG="📝 Update content"

if [ -n "$MD_FILES$MD_FILES_UNSTAGED$MD_FILES_UNTRACKED" ]; then
    ALL_MD="$MD_FILES$MD_FILES_UNSTAGED$MD_FILES_UNTRACKED"
    COUNT=$(echo "$ALL_MD" | wc -l | tr -d ' ')

    if [ $COUNT -eq 1 ]; then
        # Single file - use filename
        FILENAME=$(basename "$ALL_MD" .md)
        COMMIT_MSG="📝 Update: $FILENAME"
    elif [ $COUNT -le 3 ]; then
        # Few files - list them
        FILES=$(echo "$ALL_MD" | xargs -n1 basename | sed 's/\.md$//' | tr '\n' ', ' | sed 's/,$//')
        COMMIT_MSG="📝 Update: $FILES"
    else
        # Many files - show count
        COMMIT_MSG="📝 Update $COUNT documents"
    fi
fi

# Run main publish script with generated message
echo -e "${BLUE}Auto-generated commit message:${NC} $COMMIT_MSG"
echo ""
./publish.sh "$COMMIT_MSG"
