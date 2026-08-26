#!/usr/bin/env bash
# praxis-3d-cube-dogfood — remove a per-issue preview (container, images, workspace).
# Usage: scripts/preview-teardown.sh <issue-number>
set -Eeuo pipefail
ISSUE="${1:?Usage: $0 <issue-number>}"
if [[ ! "$ISSUE" =~ ^[0-9]+$ ]]; then echo "ERROR: issue number must be numeric, got '$ISSUE'" >&2; exit 2; fi
NAME="cube-pr-${ISSUE}"
echo "=== tearing down ${NAME} ==="
docker rm -f "$NAME" >/dev/null 2>&1 && echo "container removed" || echo "no container"
docker image ls -q "${NAME}" | sort -u | xargs -r docker rmi -f >/dev/null 2>&1 && echo "images removed" || true
rm -rf "/tmp/${NAME}" && echo "workspace removed"
