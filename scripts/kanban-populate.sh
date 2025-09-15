#!/usr/bin/env bash
set -euo pipefail

# Eco-Matrix Kanban population script
# - Ensures GitHub Project v2 exists for the owner
# - Ensures repo labels (incl. priority:*)
# - Ensures Project field "Priority" (single-select) with options High/Medium/Low
# - Upserts curated issues (create/update body + labels)
# - Adds each to the Project, sets Status=Todo and Priority
#
# Requirements:
# - gh CLI authenticated with a token that has: repo, read:project, project
# - jq installed
# - Env: GH_TOKEN exported OR `gh auth status` already authenticated
#
# Usage:
#   GH_TOKEN=... OWNER="fantasmagorikus" REPO="fantasmagorikus/eco-matrix" \
#   PROJECT_TITLE="Eco-Matrix Kanban" scripts/kanban-populate.sh

OWNER=${OWNER:-"fantasmagorikus"}
REPO=${REPO:-"${OWNER}/eco-matrix"}
PROJECT_TITLE=${PROJECT_TITLE:-"Eco-Matrix Kanban"}

log() { printf "[%s] %s\n" "$(date -u +%H:%M:%S)" "$*"; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "Error: missing '$1'" >&2; exit 1; }; }

need gh
need jq

if ! gh auth status -h github.com >/dev/null 2>&1; then
  if [[ -z "${GH_TOKEN:-}" ]]; then
    echo "Error: gh is not authenticated and GH_TOKEN is not set." >&2
    exit 1
  fi
fi

log "Owner=$OWNER Repo=$REPO Title='$PROJECT_TITLE'"

# Resolve or create Project
proj_json=$(gh project list --owner "$OWNER" --format json)
# The structure can be {projects:[...]} or a flat array depending on gh version
projects=$(echo "$proj_json" | jq -c 'if has("projects") then .projects else . end')
project_node_id=$(echo "$projects" | jq -r --arg t "$PROJECT_TITLE" '.[] | select(.title==$t) | .id' | head -n1)
project_number=$(echo "$projects" | jq -r --arg t "$PROJECT_TITLE" '.[] | select(.title==$t) | .number' | head -n1)

if [[ -z "${project_node_id:-}" ]]; then
  log "Creating project '$PROJECT_TITLE' for $OWNER ..."
  created=$(gh project create --owner "$OWNER" --title "$PROJECT_TITLE" --format json)
  project_node_id=$(echo "$created" | jq -r '.id')
  project_number=$(echo "$created" | jq -r '.number')
fi

log "Project id=$project_node_id number=$project_number"

# Ensure labels (idempotent)
log "Ensuring base + priority labels ..."
while read -r name color; do
  gh label create "$name" --color "$color" -R "$REPO" 2>/dev/null || true
done <<'LABS'
todo D4C5F9
doing F9D0C4
blocked E99695
security 5319E7
infra 0E8A16
backend 1D76DB
frontend FBCA04
data 0052CC
chat C2E0C6
ci-cd BFDADC
priority:high D73A49
priority:medium FBCA04
priority:low 0E8A16
LABS

# Fetch fields
fields=$(gh project field-list "$project_number" --owner "$OWNER" --format json)
status_field_id=$(echo "$fields" | jq -r '.fields[] | select(.name=="Status") | .id')
todo_option_id=$(echo "$fields" | jq -r '.fields[] | select(.name=="Status") | .options[] | select(.name=="Todo") | .id')
priority_field_id=$(echo "$fields" | jq -r '.fields[] | select(.name=="Priority") | .id')

# Ensure Priority field with options
if [[ -z "$priority_field_id" || "$priority_field_id" == "null" ]]; then
  log "Creating Project field 'Priority' (single-select) ..."
  gh api graphql \
    -F query='mutation($projectId:ID!){createProjectV2Field(input:{projectId:$projectId,dataType:SINGLE_SELECT,name:"Priority",singleSelectOptions:[{name:"High",description:"High priority",color:RED},{name:"Medium",description:"Medium priority",color:YELLOW},{name:"Low",description:"Low priority",color:GREEN}]}){projectV2Field{... on ProjectV2SingleSelectField{id}}}}' \
    -F projectId="$project_node_id" >/dev/null
  fields=$(gh project field-list "$project_number" --owner "$OWNER" --format json)
fi

high_opt=$(echo "$fields" | jq -r '.fields[] | select(.name=="Priority") | .options[] | select(.name=="High") | .id')
med_opt=$(echo "$fields" | jq -r '.fields[] | select(.name=="Priority") | .options[] | select(.name=="Medium") | .id')
low_opt=$(echo "$fields" | jq -r '.fields[] | select(.name=="Priority") | .options[] | select(.name=="Low") | .id')

log "Fields: Status=$status_field_id Todo=$todo_option_id Priority=$(echo "$fields"|jq -r '.fields[]|select(.name=="Priority")|.id') (High=$high_opt Medium=$med_opt Low=$low_opt)"

# Backlog definition (17 items)
read -r -d '' DESIRED << 'JSON'
[
  {"title":"Arquitetura viva no Canvas","priority":"Medium","labels":["infra"],"body":"Manter Canvas arquitetural vivo.\n- Mapear módulos (Medusa), schema GraphQL, entidades Prisma\n- Rotas/domínios no NGINX\n- Atualização contínua por PR"},
  {"title":"CI/CD: lint, typecheck, tests, build Docker","priority":"High","labels":["ci-cd","infra","priority:high"],"body":"Gates confiáveis.\n- Jobs: lint/all, typecheck/all, test/all, web/build, api/build\n- Falhou = sem deploy; cache p/ < 10m\n- Artifacts: junit/coverage/build"},
  {"title":"Observabilidade: request-id, logs estruturados, latência, alertas","priority":"High","labels":["infra","backend","priority:high"],"body":"Sinais rastreáveis.\n- request-id middleware\n- Logs JSON com level, req_id, rota, latência\n- Métricas/SLO por rota + alertas"},
  {"title":"Pagamentos: webhooks assinados + idempotência por eventId","priority":"High","labels":["backend","security","priority:high"],"body":"Fluxos corretos.\n- Verificar assinaturas + proteção replay\n- Idempotência por eventId do PSP\n- Auditoria e alertas"},
  {"title":"Segurança: CSP, HSTS, SameSite, rotação JWT, segredos PSP","priority":"High","labels":["security","infra","priority:high"],"body":"Hardening base.\n- CSP estrita (nonce)\n- HSTS preload; cookies secure+httponly; SameSite=Lax\n- Rotação chaves JWT; segredos via manager"},
  {"title":"Banco: índices, migrações revisadas, backup diário + restore testado","priority":"Medium","labels":["data","infra"],"body":"DB seguro e performático.\n- Índices úteis (prod/pedidos/clientes)\n- Backup diário + teste de restore\n- Revisar FKs/cascatas"},
  {"title":"DX: pnpm dev/test/build, .env.example, seeds só em dev","priority":"High","labels":["infra","priority:high"],"body":"DX previsível.\n- Scripts pnpm dev/test/build raiz/app\n- .env.example completo; seeds só em dev\n- Docs curtas para onboarding"},
  {"title":"Ritual de PR: check-pr.sh + anexos Thread B","priority":"Medium","labels":["ci-cd"],"body":"Fluxo de PR consistente.\n- Script check-pr.sh gera logs + anexos\n- Revisão riscos/mitigações; Closes #N"},
  {"title":"Frontend: Next 14 SSR/ISR + Edge auth/geo","priority":"Medium","labels":["frontend"],"body":"Renderização correta + edge.\n- SSR onde necessário; ISR onde cacheável\n- Edge auth/geo; cabeçalhos de cache"},
  {"title":"Backend: Medusa + Apollo (healthchecks, logs por região)","priority":"Medium","labels":["backend"],"body":"Baseline de serviços.\n- Medusa wiring\n- Apollo health/tracing\n- Logs regionais"},
  {"title":"Supabase: pooling e índices","priority":"Medium","labels":["data"],"body":"Uso eficiente de DB.\n- pgBouncer pooling\n- Índices a partir de queries lentas"},
  {"title":"Matrix texto: Synapse no Fly FRA + bridge backend","priority":"Low","labels":["chat","backend","infra"],"body":"Chat escopo interno.\n- Synapse sem federação (FRA)\n- Bridge p/ ciclo de salas; tokens curtos"},
  {"title":"Cloudflare: DNS/TLS/HSTS/Cache + whitelist CORS","priority":"Medium","labels":["infra","security"],"body":"Borda segura.\n- DNS+TLS, HSTS preload\n- CORS estrito por origem\n- Cache para estáticos/ISR"},
  {"title":"NGINX/Proxy: rotas/domínios + headers de segurança","priority":"Medium","labels":["infra","security"],"body":"Ingress adequado.\n- Mapa de rotas/domínios\n- Headers de segurança no proxy\n- timeouts/limites; gzip/brotli"},
  {"title":"CI Pipelines nomeadas: web/build, api/build, lint/all, typecheck/all","priority":"Medium","labels":["ci-cd"],"body":"Nomear jobs p/ proteções.\n- web/build, api/build, lint/all, typecheck/all\n- Atualizar branch protections"},
  {"title":"Script check-pr.sh (WSL)","priority":"Medium","labels":["ci-cd","infra"],"body":"Sanity automatizado.\n- Logs, curl sanity, docker compose re-up\n- Saídas anexadas no PR"},
  {"title":"Templates: PR/Issue + Labels de fluxo","priority":"High","labels":["ci-cd","infra","priority:high"],"body":"Templates consistentes.\n- PR/Issue templates\n- Labels Todo/Doing/Blocked padronizadas\n- Checklist de PR"}
]
JSON

# Helpers
search_issue() {
  local t="$1"; local q="repo:$REPO type:issue in:title \"$t\"";
  gh api -X GET -H 'Accept: application/vnd.github+json' search/issues -f q="$q" --jq '.items[0].html_url // empty'
}

add_to_project() {
  local url="$1" prio="$2"
  local item item_id opt
  item=$(gh project item-add "$project_number" --owner "$OWNER" --url "$url" --format json 2>/dev/null || true)
  if [[ -n "$item" ]]; then
    item_id=$(echo "$item" | jq -r '.id')
  else
    # lookup existing
    local nodes
    nodes=$(gh api graphql -F query='query($project:ID!,$first:Int!){node(id:$project){... on ProjectV2{items(first:$first){nodes{id content{__typename ... on Issue{url}}}}}}}' -F project="$project_node_id" -F first=100 --jq '.data.node.items.nodes')
    item_id=$(echo "$nodes" | jq -r --arg u "$url" '.[] | select(.content.url==$u) | .id' | head -n1)
  fi
  if [[ -n "${item_id:-}" ]]; then
    gh project item-edit --project-id "$project_node_id" --id "$item_id" --field-id "$status_field_id" --single-select-option-id "$todo_option_id" >/dev/null || true
    case "$prio" in
      High) opt="$high_opt" ;;
      Medium) opt="$med_opt" ;;
      Low) opt="$low_opt" ;;
      *) opt="" ;;
    esac
    if [[ -n "$opt" ]]; then
      gh project item-edit --project-id "$project_node_id" --id "$item_id" --field-id "$priority_field_id" --single-select-option-id "$opt" >/dev/null || true
    fi
  fi
}

log "Upserting issues and populating project ..."

# Optional slicing: set SLICE_START and SLICE_END to process a subset
SLICE_START=${SLICE_START:-}
SLICE_END=${SLICE_END:-}
if [[ -n "${SLICE_START}" || -n "${SLICE_END}" ]]; then
  log "Processing slice ${SLICE_START:-0}:${SLICE_END:-end}"
  SELECTION=$(echo "$DESIRED" | jq ".[${SLICE_START:-0}:${SLICE_END:-999}]")
else
  SELECTION="$DESIRED"
fi

echo "$SELECTION" | jq -c '.[]' | while read -r row; do
  title=$(echo "$row" | jq -r '.title')
  body=$(echo "$row" | jq -r '.body')
  prio=$(echo "$row" | jq -r '.priority')
  mapfile -t lbls < <(echo "$row" | jq -r '.labels[]')
  url=$(search_issue "$title") || url=""
  if [[ -z "$url" ]]; then
    # Create
    args=( -X POST -H 'Accept: application/vnd.github+json' "repos/$REPO/issues" -f "title=$title" -f "body=$body" )
    for l in "${lbls[@]}"; do args+=( -f "labels[]=$l" ); done
    resp=$(gh api "${args[@]}")
    url=$(echo "$resp" | jq -r '.html_url')
    log "Created: $url"
  else
    # Update
    num=${url##*/}
    cur=$(gh api -H 'Accept: application/vnd.github+json' "repos/$REPO/issues/$num")
    cur_labels=$(echo "$cur" | jq -r '[.labels[].name] // []')
    new_labels=$(printf '%s\n' "${lbls[@]}" | jq -R . | jq -s .)
    merged=$(jq -n --argjson a "$cur_labels" --argjson b "$new_labels" '$a + $b | unique')
    gh api -X PATCH -H 'Accept: application/vnd.github+json' "repos/$REPO/issues/$num" -f "body=$body" -f "labels=$merged" >/dev/null
    log "Updated: $url"
  fi
  add_to_project "$url" "$prio"
  sleep 0.3
done

# Ensure views (Board/Table)
views=$(gh project view "$project_number" --owner "$OWNER" --format json)
board=$(echo "$views" | jq -r '.views[]? | select(.name=="Board") | .name')
[[ -n "$board" ]] || gh project view "$project_number" --owner "$OWNER" --add-view "Board" >/dev/null || true
views=$(gh project view "$project_number" --owner "$OWNER" --format json)
table=$(echo "$views" | jq -r '.views[]? | select(.name=="Table") | .name')
[[ -n "$table" ]] || gh project view "$project_number" --owner "$OWNER" --add-view "Table" >/dev/null || true

log "Done. Project URL: https://github.com/users/${OWNER}/projects/${project_number}"
