#!/usr/bin/env bash
#
# praxis-3d-cube-dogfood — per-issue preview deploy. Runs ON the VPS (noob-root), invoked over
# SSH by the org reusable-autopilot-runner's deploy-preview job, or by hand for the Praxis
# preview-gate baseline.
#
# Usage: scripts/preview-deploy.sh <branch> <issue-number> [commit-sha] [repo-url]
#
# One container per issue: cube-pr-<N>, a static nginx image built from Dockerfile.preview at
# the exact commit, attached to the shared Traefik network with a Host() rule for
#   https://${PREVIEW_PREFIX:-preview-cube-}<N>.${PREVIEW_DOMAIN:-pscx.ai}
# (PREVIEW_PREFIX / PREVIEW_DOMAIN are passed by the runner; the defaults match the cube repo's
# Actions variables so a hand run and a runner run produce the same URL.) Waits for the URL to
# answer 200 before returning. Idempotent: an existing preview for the same issue is replaced.
set -Eeuo pipefail

BRANCH="${1:?Usage: $0 <branch> <issue-number> [commit-sha] [repo-url]}"
ISSUE="${2:?Usage: $0 <branch> <issue-number> [commit-sha] [repo-url]}"
COMMIT_SHA="${3:-}"
REPO_URL="${4:-}"
if [[ ! "$ISSUE" =~ ^[0-9]+$ ]]; then echo "ERROR: issue number must be numeric, got '$ISSUE'" >&2; exit 2; fi

PREFIX="${PREVIEW_PREFIX:-preview-cube-}"
DOMAIN="${PREVIEW_DOMAIN:-pscx.ai}"
NETWORK="${PREVIEW_NETWORK:-proxy}"
HOST="${PREFIX}${ISSUE}.${DOMAIN}"
NAME="cube-pr-${ISSUE}"
WORKSPACE="/tmp/${NAME}"
if [ -z "$REPO_URL" ]; then
  if [ -n "${GITHUB_TOKEN:-}" ]; then REPO_URL="https://x-access-token:${GITHUB_TOKEN}@github.com/cloudwarriors-ai/praxis-3d-cube-dogfood.git"
  else REPO_URL="git@github.com:cloudwarriors-ai/praxis-3d-cube-dogfood.git"; fi
fi

t0=$(date +%s)
log() { printf '[%s +%ss] %s\n' "$NAME" "$(( $(date +%s) - t0 ))" "$*"; }

log "1/5 clean previous preview"
docker rm -f "$NAME" >/dev/null 2>&1 || true
rm -rf "$WORKSPACE"

log "2/5 clone ${BRANCH}${COMMIT_SHA:+ @ $COMMIT_SHA}"
git clone --quiet --depth 50 --branch "$BRANCH" "$REPO_URL" "$WORKSPACE"
if [ -n "$COMMIT_SHA" ]; then git -C "$WORKSPACE" checkout --quiet "$COMMIT_SHA"; fi
SHA=$(git -C "$WORKSPACE" rev-parse --short HEAD)

log "3/5 build image ${NAME}:${SHA}"
docker build --quiet -t "${NAME}:${SHA}" -t "${NAME}:latest" -f "$WORKSPACE/Dockerfile.preview" "$WORKSPACE" >/dev/null

log "4/5 run on network ${NETWORK} as https://${HOST}"
docker run -d --name "$NAME" --restart unless-stopped \
  --network "$NETWORK" \
  --label "preview.repo=cloudwarriors-ai/praxis-3d-cube-dogfood" \
  --label "preview.issue=${ISSUE}" \
  --label "preview.sha=${SHA}" \
  --label "preview.created=$(date -u +%FT%TZ)" \
  --label traefik.enable=true \
  --label "traefik.docker.network=${NETWORK}" \
  --label "traefik.http.routers.${NAME}.rule=Host(\`${HOST}\`)" \
  --label "traefik.http.routers.${NAME}.entrypoints=websecure" \
  --label "traefik.http.routers.${NAME}.tls=true" \
  --label "traefik.http.routers.${NAME}.tls.certresolver=letsencrypt" \
  --label "traefik.http.services.${NAME}.loadbalancer.server.port=80" \
  "${NAME}:${SHA}" >/dev/null

log "5/5 wait for https://${HOST}/"
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "https://${HOST}/" || true)
  if [ "$code" = "200" ]; then
    log "READY https://${HOST}/ (sha ${SHA}, ${i} polls)"
    echo "PREVIEW_URL=https://${HOST}/"
    exit 0
  fi
  sleep 5
done
log "FAILED: https://${HOST}/ not 200 after 150s (last code: ${code:-none})"
docker logs --tail 20 "$NAME" 2>&1 | sed 's/^/  | /' || true
exit 1
