#!/usr/bin/env bash
set -euo pipefail

# Attempt to configure the Eco-Matrix Kanban Board view:
# - Ensure a Board view exists
# - Suggest manual steps to Group by Status and Sort by Priority
# - Optionally attempts GraphQL update if supported

OWNER=${OWNER:-"fantasmagorikus"}
PROJECT_TITLE=${PROJECT_TITLE:-"Eco-Matrix Kanban"}

need() { command -v "$1" >/dev/null 2>&1 || { echo "Error: missing '$1'" >&2; exit 1; }; }
need gh; need jq

proj=$(gh project list --owner "$OWNER" --format json)
projects=$(echo "$proj" | jq -c 'if has("projects") then .projects else . end')
PROJECT_NODE_ID=$(echo "$projects" | jq -r --arg t "$PROJECT_TITLE" '.[] | select(.title==$t) | .id')
PROJECT_NUMBER=$(echo "$projects" | jq -r --arg t "$PROJECT_TITLE" '.[] | select(.title==$t) | .number')
if [[ -z "$PROJECT_NODE_ID" || -z "$PROJECT_NUMBER" ]]; then
  echo "Project '$PROJECT_TITLE' not found for owner $OWNER" >&2; exit 2
fi

# Ensure Board/Table views exist via gh CLI
views=$(gh project view "$PROJECT_NUMBER" --owner "$OWNER" --format json)
if ! echo "$views" | jq -e '.views[]? | select(.name=="Board")' >/dev/null; then
  gh project view "$PROJECT_NUMBER" --owner "$OWNER" --add-view "Board" >/dev/null || true
fi
if ! echo "$views" | jq -e '.views[]? | select(.name=="Table")' >/dev/null; then
  gh project view "$PROJECT_NUMBER" --owner "$OWNER" --add-view "Table" >/dev/null || true
fi

cat <<EOF
Views ensured.
- Open: https://github.com/users/${OWNER}/projects/${PROJECT_NUMBER}
- In the Board view:
  1) Group by: Status
  2) Sort by: Priority (High -> Low)

Note: GitHub's public CLI lacks stable flags to set group/sort; GraphQL mutations for views
may not be available in your org. If you want an experimental attempt, set:
  TRY_GRAPHQL=1 OWNER=${OWNER} PROJECT_TITLE='${PROJECT_TITLE}' scripts/kanban-configure-views.sh
EOF

if [[ "${TRY_GRAPHQL:-}" == "1" ]]; then
  echo "Attempting GraphQL fetch of views (experimental)..."
  read -r -d '' Q <<'GQL'
query($project:ID!){
  node(id:$project){
    ... on ProjectV2{
      views(first:20){ nodes { id name } }
      fields(first:50){ nodes { __typename ... on ProjectV2SingleSelectField { id name } } }
    }
  }
}
GQL
  data=$(gh api graphql -F query="$Q" -F project="$PROJECT_NODE_ID" || true)
  echo "$data" | jq -r '.data.node.views.nodes[]? | [.id,.name] | @tsv' || true
  echo "If a 'Board' view id is listed, we can try to update it via updateProjectV2View when available."
fi

