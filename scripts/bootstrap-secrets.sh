#!/usr/bin/env bash
set -euo pipefail

# Bootstrap GitHub Actions secrets for Vercel deploys.
# Usage (example):
#   GH_REPO="fantasmagorikus/eco-matrix" \
#   VERCEL_TOKEN="<token>" \
#   VERCEL_ORG_ID="team_83aSchCjcueg7D5BnJknkzzU" \
#   VERCEL_PROJECT_ID="prj_rKkn9Xwloeh70JQLUVqAASTAi90f" \
#   scripts/bootstrap-secrets.sh

GH_REPO=${GH_REPO:-}
VERCEL_TOKEN=${VERCEL_TOKEN:-}
VERCEL_ORG_ID=${VERCEL_ORG_ID:-}
VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID:-}

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is required. Install from https://cli.github.com/" >&2
  exit 1
fi

if [[ -z "$GH_REPO" || -z "$VERCEL_TOKEN" || -z "$VERCEL_ORG_ID" || -z "$VERCEL_PROJECT_ID" ]]; then
  echo "Error: Missing required env vars. Provide GH_REPO, VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID." >&2
  exit 1
fi

echo "Checking GitHub auth..." >&2
if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "You must login first: gh auth login" >&2
  exit 1
fi

echo "Setting secrets in $GH_REPO ..." >&2
gh secret set VERCEL_TOKEN -R "$GH_REPO" -b "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID -R "$GH_REPO" -b "$VERCEL_ORG_ID"
gh secret set VERCEL_PROJECT_ID -R "$GH_REPO" -b "$VERCEL_PROJECT_ID"

echo "Done. Current secrets:" >&2
gh secret list -R "$GH_REPO"

