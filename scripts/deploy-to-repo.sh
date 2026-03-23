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

DEPLOY_REPO="${1:-${DEPLOY_REPO_URL:-}}"
DEPLOY_BRANCH="${2:-${DEPLOY_BRANCH:-main}}"

if [[ -z "$DEPLOY_REPO" ]]; then
  echo "Error: No deploy repo URL provided."
  echo "Usage: $0 <deploy-repo-url> [branch]"
  echo "   or: DEPLOY_REPO_URL=... $0"
  exit 1
fi

WORKSPACE_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$WORKSPACE_ROOT/apps/web/.next"
DEPLOY_TMP="$(mktemp -d)"

trap 'rm -rf "$DEPLOY_TMP"' EXIT

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

# Clear old content (keep .git)
find "$DEPLOY_TMP" -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +

# Copy the standalone build output
if [[ -d "$BUILD_DIR/standalone" ]]; then
  # Next.js standalone output mode
  cp -R "$BUILD_DIR/standalone/." "$DEPLOY_TMP/"
  # Static assets must be copied separately in standalone mode
  if [[ -d "$BUILD_DIR/static" ]]; then
    mkdir -p "$DEPLOY_TMP/.next/static"
    cp -R "$BUILD_DIR/static/." "$DEPLOY_TMP/.next/static/"
  fi
else
  # Full project copy for standard Next.js deployments
  cp -R "$WORKSPACE_ROOT/apps/web/package.json" "$DEPLOY_TMP/"
  cp -R "$WORKSPACE_ROOT/apps/web/next.config.ts" "$DEPLOY_TMP/" 2>/dev/null || true
  cp -R "$WORKSPACE_ROOT/apps/web/public" "$DEPLOY_TMP/" 2>/dev/null || true
  mkdir -p "$DEPLOY_TMP/.next"
  cp -R "$BUILD_DIR/." "$DEPLOY_TMP/.next/"
fi

# Copy the data file so the deploy repo has the validated JSON
mkdir -p "$DEPLOY_TMP/data"
cp "$WORKSPACE_ROOT/data/websites.json" "$DEPLOY_TMP/data/" 2>/dev/null || true

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
