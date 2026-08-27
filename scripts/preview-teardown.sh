#!/usr/bin/env bash
# praxis-3d-cube-dogfood — remove a per-issue preview: container, images, workspace, and its
# tailnet Serve entry (PREVIEW_PORT_BASE + issue; default 20000 + N). Safe to run repeatedly.
# Usage: scripts/preview-teardown.sh <issue-number>
set -Eeuo pipefail
ISSUE="${1:?Usage: $0 <issue-number>}"
if [[ ! "$ISSUE" =~ ^[0-9]+$ ]]; then echo "ERROR: issue number must be numeric, got '$ISSUE'" >&2; exit 2; fi
NAME="cube-pr-${ISSUE}"
PORT=$(( ${PREVIEW_PORT_BASE:-20000} + ISSUE ))
echo "=== tearing down ${NAME} ==="
tailscale serve --https="$PORT" off >/dev/null 2>&1 && echo "tailnet serve :${PORT} removed" || echo "no tailnet serve entry"
docker rm -f "$NAME" >/dev/null 2>&1 && echo "container removed" || echo "no container"
docker images -q "${NAME}" | sort -u | xargs -r docker rmi -f >/dev/null 2>&1 && echo "images removed" || true
rm -rf "/tmp/${NAME}" && echo "workspace removed"
