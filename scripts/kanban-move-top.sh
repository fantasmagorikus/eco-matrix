#!/usr/bin/env bash
set -euo pipefail

# Move top priorities to In Progress on the Eco-Matrix Kanban board.
# Requirements: gh (with repo + project scopes), jq. GH_TOKEN may be set.

OWNER=${OWNER:-"fantasmagorikus"}
REPO=${REPO:-"${OWNER}/eco-matrix"}
PROJECT_TITLE=${PROJECT_TITLE:-"Eco-Matrix Kanban"}

need() { command -v "$1" >/dev/null 2>&1 || { echo "Error: missing '$1'" >&2; exit 1; }; }
need gh; need jq

# Resolve project ids
proj=$(gh project list --owner "$OWNER" --format json)
projects=$(echo "$proj" | jq -c 'if has("projects") then .projects else . end')
PROJECT_NODE_ID=$(echo "$projects" | jq -r --arg t "$PROJECT_TITLE" '.[] | select(.title==$t) | .id')
PROJECT_NUMBER=$(echo "$projects" | jq -r --arg t "$PROJECT_TITLE" '.[] | select(.title==$t) | .number')
if [[ -z "$PROJECT_NODE_ID" || -z "$PROJECT_NUMBER" ]]; then
  echo "Project '$PROJECT_TITLE' not found for owner $OWNER" >&2; exit 2
fi

# Resolve Status field + In Progress option
fields=$(gh project field-list "$PROJECT_NUMBER" --owner "$OWNER" --format json)
STATUS_FIELD_ID=$(echo "$fields" | jq -r '.fields[] | select(.name=="Status") | .id')
INPROG_OPT=$(echo "$fields" | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name=="In Progress") | .id')
if [[ -z "$STATUS_FIELD_ID" || -z "$INPROG_OPT" || "$INPROG_OPT" == null ]]; then
  echo "Could not resolve 'Status' field or 'In Progress' option." >&2; exit 3
fi

get_item_id() {
  local url="$1" item_json nodes
  item_json=$(gh project item-add "$PROJECT_NUMBER" --owner "$OWNER" --url "$url" --format json 2>/dev/null || true)
  if [[ -n "$item_json" ]]; then echo "$item_json" | jq -r '.id'; return; fi
  nodes=$(gh api graphql -F query='query($project:ID!,$first:Int!){node(id:$project){... on ProjectV2{items(first:$first){nodes{id content{__typename ... on Issue{url}}}}}}}' -F project="$PROJECT_NODE_ID" -F first=100 --jq '.data.node.items.nodes')
  echo "$nodes" | jq -r --arg u "$url" '.[] | select(.content.url==$u) | .id' | head -n1
}

mapfile -t TITLES <<'EOF'
CI/CD: lint, typecheck, tests, build Docker
Segurança: CSP, HSTS, SameSite, rotação JWT, segredos PSP
Observabilidade: request-id, logs estruturados, latência, alertas
EOF

for t in "${TITLES[@]}"; do
  q="repo:$REPO type:issue in:title \"$t\""
  url=$(gh api -X GET -H 'Accept: application/vnd.github+json' search/issues -f q="$q" --jq '.items[0].html_url // empty' || true)
  if [[ -z "$url" ]]; then
    echo "WARN: issue not found: $t" >&2; continue
  fi
  item_id=$(get_item_id "$url")
  if [[ -z "$item_id" ]]; then
    echo "WARN: could not resolve project item for $url" >&2; continue
  fi
  gh project item-edit --project-id "$PROJECT_NODE_ID" --id "$item_id" --field-id "$STATUS_FIELD_ID" --single-select-option-id "$INPROG_OPT" >/dev/null
  echo "Moved to In Progress: $t ($url)"
done

echo "Done. Project: https://github.com/users/${OWNER}/projects/${PROJECT_NUMBER}"

