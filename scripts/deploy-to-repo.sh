#!/usr/bin/env bash
set -euo pipefail

# deploy-to-repo.sh — Push the built Next.js app to a deploy repo
#
# Usage:
#   ./scripts/deploy-to-repo.sh <deploy-repo-url> [branch]
#
# Environment variables:
#   DEPLOY_REPO_URL  — fallback if not passed as $1
#   DEPLOY_BRANCH    — fallback if not passed as $2 (default: main)
#   DEPLOY_TOKEN     — optional GitHub token for auth (used in CI)
#   DEPLOY_BUILD_DIR — optional build artifact directory (default: dist/sites/${SITE_ID:-default})
#   DEPLOY_PRESERVE_PATHS — newline-delimited paths to preserve across sync

DEPLOY_REPO="${1:-${DEPLOY_REPO_URL:-}}"
DEPLOY_BRANCH="${2:-${DEPLOY_BRANCH:-main}}"

if [[ -z "$DEPLOY_REPO" ]]; then
  echo "Error: No deploy repo URL provided."
  echo "Usage: $0 <deploy-repo-url> [branch]"
  echo "   or: DEPLOY_REPO_URL=... $0"
  exit 1
fi

WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${DEPLOY_BUILD_DIR:-$WORKSPACE_ROOT/dist/sites/${SITE_ID:-default}}"
DEPLOY_TMP="$WORKSPACE_ROOT/tmp/deploy/$(date -u '+%Y%m%d-%H%M%S')"
TARGET_PAGES_WORKFLOW_TEMPLATE="$WORKSPACE_ROOT/scripts/templates/target-pages-deploy.yml"
PRESERVE_TMP="$DEPLOY_TMP/.preserve"

mkdir -p "$DEPLOY_TMP"

echo "==> Checking build output..."
if [[ ! -d "$BUILD_DIR" ]]; then
  echo "Error: Build output not found at $BUILD_DIR"
  echo "Run the build first: pnpm build"
  exit 1
fi

# If DEPLOY_TOKEN is set, inject it into the repo URL for CI auth
PUSH_URL="$DEPLOY_REPO"
if [[ -n "${DEPLOY_TOKEN:-}" ]]; then
  PUSH_URL="$(echo "$DEPLOY_REPO" | sed "s|https://|https://x-access-token:${DEPLOY_TOKEN}@|")"
fi

echo "==> Cloning deploy repo..."
git clone --depth 1 --branch "$DEPLOY_BRANCH" "$PUSH_URL" "$DEPLOY_TMP" 2>/dev/null || {
  echo "Branch $DEPLOY_BRANCH doesn't exist yet, initializing..."
  git init "$DEPLOY_TMP"
  cd "$DEPLOY_TMP"
  git checkout -b "$DEPLOY_BRANCH"
  git remote add origin "$PUSH_URL"
  cd -
}

echo "==> Syncing build output..."

if [[ -n "${DEPLOY_PRESERVE_PATHS:-}" ]]; then
  echo "==> Preserving configured target paths..."
  mkdir -p "$PRESERVE_TMP"

  while IFS= read -r preserve_path; do
    [[ -z "$preserve_path" ]] && continue
    if [[ -e "$DEPLOY_TMP/$preserve_path" ]]; then
      mkdir -p "$PRESERVE_TMP/$(dirname "$preserve_path")"
      cp -R "$DEPLOY_TMP/$preserve_path" "$PRESERVE_TMP/$preserve_path"
    fi
  done <<< "$DEPLOY_PRESERVE_PATHS"
fi

# Clear old content (keep .git and temporary preserve cache)
find "$DEPLOY_TMP" -mindepth 1 -maxdepth 1 ! -name '.git' ! -name '.preserve' -exec rm -rf {} +

cp -R "$BUILD_DIR/." "$DEPLOY_TMP/"

if [[ -d "$PRESERVE_TMP" ]]; then
  echo "==> Restoring preserved target paths..."
  cp -R "$PRESERVE_TMP/." "$DEPLOY_TMP/"
fi

if [[ -f "$TARGET_PAGES_WORKFLOW_TEMPLATE" ]]; then
  echo "==> Installing target GitHub Pages workflow..."
  mkdir -p "$DEPLOY_TMP/.github/workflows"
  cp "$TARGET_PAGES_WORKFLOW_TEMPLATE" "$DEPLOY_TMP/.github/workflows/deploy.yml"
fi

echo "==> Committing and pushing..."
cd "$DEPLOY_TMP"
git add -A

COMMIT_MSG="deploy: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
if [[ -n "${GITHUB_SHA:-}" ]]; then
  COMMIT_MSG="deploy: ${GITHUB_SHA:0:7} @ $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
fi

# Check if there are changes to commit
if git diff --cached --quiet 2>/dev/null; then
  echo "No changes to deploy."
  exit 0
fi

git -c user.name="deploy-bot" -c user.email="deploy-bot@users.noreply.github.com" \
  commit -m "$COMMIT_MSG"
git push origin "$DEPLOY_BRANCH"

echo "==> Deployed to $DEPLOY_REPO ($DEPLOY_BRANCH)"
