#!/usr/bin/env bash
set -euo pipefail

# Configure Vercel project settings via API.
# Required env vars:
#   VERCEL_TOKEN        - API token
#   VERCEL_ORG_ID       - team_... id
#   VERCEL_PROJECT_ID   - prj_... id
# Optional overrides:
#   ROOT_DIR            - default: apps/web
#   NODE_VERSION        - default: 20.x

VERCEL_TOKEN=${VERCEL_TOKEN:-}
VERCEL_ORG_ID=${VERCEL_ORG_ID:-}
VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID:-}
ROOT_DIR=${ROOT_DIR:-apps/web}
NODE_VERSION=${NODE_VERSION:-20.x}

if [[ -z "$VERCEL_TOKEN" || -z "$VERCEL_ORG_ID" || -z "$VERCEL_PROJECT_ID" ]]; then
  echo "Missing required env vars: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID" >&2
  exit 1
fi

base="https://api.vercel.com"
hdr=( -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" )

echo "Fetching current project..." >&2
curl -fsSL "${base}/v10/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_ORG_ID}" "${hdr[@]}" | sed -n '1,120p'
echo

echo "Updating rootDirectory -> ${ROOT_DIR}" >&2
curl -fsSL -X PATCH "${base}/v10/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_ORG_ID}" \
  "${hdr[@]}" \
  -d "{\"rootDirectory\":\"${ROOT_DIR}\"}" | sed -n '1,40p' >/dev/null

echo "Updating settings.nodeVersion -> ${NODE_VERSION}" >&2
curl -fsSL -X PATCH "${base}/v10/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_ORG_ID}" \
  "${hdr[@]}" \
  -d "{\"settings\":{\"nodeVersion\":\"${NODE_VERSION}\"}}" | sed -n '1,40p' >/dev/null

echo "Done. Effective project excerpt:" >&2
curl -fsSL "${base}/v10/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_ORG_ID}" "${hdr[@]}" | sed -n '1,160p'

