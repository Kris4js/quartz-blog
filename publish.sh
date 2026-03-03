#!/bin/bash

# Quartz Blog Auto Publish Script
# Usage: ./publish.sh [commit message]
# If no commit message provided, it will prompt for one

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Quartz Blog Auto Publish Script${NC}\n"

# Function to print step
print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "quartz.config.ts" ]; then
    print_error "Error: This script must be run from the quartz-blog root directory"
    exit 1
fi

# Check if there are any changes
if git diff-index --quiet HEAD --; then
    if [ -z "$(git ls-files --others --exclude-standard)" ]; then
        print_error "No changes to publish!"
        echo "Make some changes to your content first."
        exit 0
    fi
fi

# Get commit message
if [ -z "$1" ]; then
    echo -e "${YELLOW}What changes did you make?${NC}"
    read -p "Commit message: " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        print_error "Commit message cannot be empty"
        exit 1
    fi
else
    COMMIT_MSG="$1"
fi

echo ""

# Step 1: Show changed files
print_step "Checking changed files..."
CHANGED_FILES=$(git status --short)
if [ -n "$CHANGED_FILES" ]; then
    echo "$CHANGED_FILES"
    echo ""
fi

# Step 2: Build project to ensure no errors
print_step "Building project to verify changes..."
if npx quartz build > /dev/null 2>&1; then
    print_success "Build successful!"
else
    print_error "Build failed! Please fix errors before publishing."
    echo ""
    echo "Run 'npx quartz build' to see error details."
    exit 1
fi

# Step 3: Stage all changes
print_step "Staging changes..."
git add -A
print_success "Changes staged"

# Step 4: Commit changes
print_step "Committing changes..."
git commit -m "$COMMIT_MSG"
print_success "Changes committed"

# Step 5: Push to remote
print_step "Pushing to GitHub..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "v4" ]; then
    print_error "Warning: You're not on the v4 branch!"
    echo "Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Push cancelled."
        exit 0
    fi
fi

if git push origin "$CURRENT_BRANCH"; then
    print_success "Pushed to GitHub!"
else
    print_error "Push failed! Check your network connection and permissions."
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Successfully published!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. GitHub Actions will automatically build and deploy your site"
echo "2. Check deployment status at: https://github.com/Kris4js/quartz-blog/actions"
echo "3. Your site will be live at: https://kris4js.github.io/quartz-blog/"
echo ""
