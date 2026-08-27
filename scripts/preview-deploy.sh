#!/usr/bin/env bash
#
# praxis-3d-cube-dogfood — per-issue preview deploy. Runs ON the VPS (noob-root), invoked over
# SSH by the org reusable-autopilot-runner's deploy-preview job, or by hand.
#
# Usage: scripts/preview-deploy.sh <branch> <issue-number> [commit-sha] [repo-url]
#
# One static nginx container per issue (cube-pr-<N>) built from Dockerfile.preview at the exact
# commit. Two exposure modes, selected by PREVIEW_MODE (the runner passes the repo's Actions vars):
#
#   tailnet (default) — the container binds 127.0.0.1:<PORT> only and is published with
#       `tailscale serve --https=<PORT>` as https://<PREVIEW_TS_HOST>:<PORT>/ — reachable from
#       tailnet members only, no public route, cert provisioned by Tailscale. PORT =
#       PREVIEW_PORT_BASE + issue (default 20000 + N). The node cannot reach its own Serve URL,
#       so readiness is checked on 127.0.0.1:<PORT>; the runner verifies the tailnet URL itself.
#   public — legacy Traefik route https://${PREVIEW_PREFIX}<N>.${PREVIEW_DOMAIN}/ on the shared
#       proxy network (kept for comparison; not used for held previews).
#
# Idempotent: an existing preview for the same issue is replaced. Prints PREVIEW_URL=... on success.
set -Eeuo pipefail

BRANCH="${1:?Usage: $0 <branch> <issue-number> [commit-sha] [repo-url]}"
ISSUE="${2:?Usage: $0 <branch> <issue-number> [commit-sha] [repo-url]}"
COMMIT_SHA="${3:-}"
REPO_URL="${4:-}"
if [[ ! "$ISSUE" =~ ^[0-9]+$ ]]; then echo "ERROR: issue number must be numeric, got '$ISSUE'" >&2; exit 2; fi

MODE="${PREVIEW_MODE:-tailnet}"
PORT_BASE="${PREVIEW_PORT_BASE:-20000}"
TS_HOST="${PREVIEW_TS_HOST:-$(tailscale status --json 2>/dev/null | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["Self"]["DNSName"].rstrip("."))' 2>/dev/null || echo noob-root.tailcc6c5f.ts.net)}"
PREFIX="${PREVIEW_PREFIX:-preview-cube-}"
DOMAIN="${PREVIEW_DOMAIN:-pscx.ai}"
NETWORK="${PREVIEW_NETWORK:-proxy}"
PORT=$((PORT_BASE + ISSUE))
NAME="cube-pr-${ISSUE}"
WORKSPACE="/tmp/${NAME}"
if [ -z "$REPO_URL" ]; then
  if [ -n "${GITHUB_TOKEN:-}" ]; then REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/cloudwarriors-ai/praxis-3d-cube-dogfood.git"
  else REPO_URL="git@github.com:cloudwarriors-ai/praxis-3d-cube-dogfood.git"; fi
fi

t0=$(date +%s)
log() { printf '[%s +%ss] %s\n' "$NAME" "$(( $(date +%s) - t0 ))" "$*"; }

# Capacity belt (Praxis owns the bound — Repo.preview_capacity; this catches manual or
# out-of-band runs). Counts this repo's OTHER standing previews by label; a redeploy of the
# same issue replaces in place and must not count itself. Unset/0 = no belt.
CAPACITY="${PREVIEW_CAPACITY:-0}"
if [ "$CAPACITY" -gt 0 ] 2>/dev/null; then
  OTHERS=$(docker ps --filter "label=preview.repo=cloudwarriors-ai/praxis-3d-cube-dogfood" --format '{{.Label "preview.issue"}}' | grep -vx "$ISSUE" | sort -u | wc -l)
  if [ "$OTHERS" -ge "$CAPACITY" ]; then
    echo "ERROR: preview capacity reached (${OTHERS}/${CAPACITY} other previews standing) — refusing to deploy issue ${ISSUE}" >&2
    exit 1
  fi
  log "0/5 capacity ${OTHERS}/${CAPACITY} other previews standing"
fi

log "1/5 clean previous preview (mode=${MODE})"
docker rm -f "$NAME" >/dev/null 2>&1 || true
tailscale serve --https="$PORT" off >/dev/null 2>&1 || true
rm -rf "$WORKSPACE"

log "2/5 clone ${BRANCH}${COMMIT_SHA:+ @ $COMMIT_SHA}"
git clone --quiet --depth 50 --branch "$BRANCH" "$REPO_URL" "$WORKSPACE"
if [ -n "$COMMIT_SHA" ]; then git -C "$WORKSPACE" checkout --quiet "$COMMIT_SHA"; fi
SHA=$(git -C "$WORKSPACE" rev-parse --short HEAD)

log "3/5 build image ${NAME}:${SHA}"
docker build --quiet -t "${NAME}:${SHA}" -t "${NAME}:latest" -f "$WORKSPACE/Dockerfile.preview" "$WORKSPACE" >/dev/null

COMMON_LABELS=(--label "preview.repo=cloudwarriors-ai/praxis-3d-cube-dogfood" --label "preview.issue=${ISSUE}" --label "preview.sha=${SHA}" --label "preview.mode=${MODE}" --label "preview.created=$(date -u +%FT%TZ)")

if [ "$MODE" = "tailnet" ]; then
  URL="https://${TS_HOST}:${PORT}/"
  log "4/5 run bound to 127.0.0.1:${PORT}; publish on the tailnet as ${URL}"
  docker run -d --name "$NAME" --restart unless-stopped -p "127.0.0.1:${PORT}:80" "${COMMON_LABELS[@]}" "${NAME}:${SHA}" >/dev/null
  tailscale serve --bg --https="$PORT" "http://127.0.0.1:${PORT}" >/dev/null
  READY_PROBE="http://127.0.0.1:${PORT}/"
else
  HOST="${PREFIX}${ISSUE}.${DOMAIN}"
  URL="https://${HOST}/"
  log "4/5 run on network ${NETWORK} as ${URL}"
  docker run -d --name "$NAME" --restart unless-stopped --network "$NETWORK" "${COMMON_LABELS[@]}" \
    --label traefik.enable=true --label "traefik.docker.network=${NETWORK}" \
    --label "traefik.http.routers.${NAME}.rule=Host(\`${HOST}\`)" \
    --label "traefik.http.routers.${NAME}.entrypoints=websecure" \
    --label "traefik.http.routers.${NAME}.tls=true" \
    --label "traefik.http.routers.${NAME}.tls.certresolver=letsencrypt" \
    --label "traefik.http.services.${NAME}.loadbalancer.server.port=80" \
    "${NAME}:${SHA}" >/dev/null
  READY_PROBE="$URL"
fi

log "5/5 wait for ${READY_PROBE}"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$READY_PROBE" || true)
  if [ "$code" = "200" ]; then
    log "READY ${URL} (sha ${SHA}, ${i} polls)"
    echo "PREVIEW_URL=${URL}"
    exit 0
  fi
  sleep 5
done
log "FAILED: ${READY_PROBE} not 200 after 150s (last code: ${code:-none})"
docker logs --tail 20 "$NAME" 2>&1 | sed 's/^/  | /' || true
exit 1
