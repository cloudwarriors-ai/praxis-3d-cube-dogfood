#!/usr/bin/env bash
# Apply defect patches to the clean baseline.
#   bash defects/apply.sh                      # apply every code defect
#   bash defects/apply.sh 01-solver-invalid-state [03-...]   # apply named subset
#
# Patches are independent (each touches a distinct file) and applied with
# `git apply`, so this is deterministic from a clean tree.
set -euo pipefail
cd "$(dirname "$0")/.."
DEFECTS_DIR="defects"

shopt -s nullglob
if [ "$#" -eq 0 ]; then
  patches=("$DEFECTS_DIR"/[0-9][0-9]-*.patch)
else
  patches=()
  for name in "$@"; do
    p="$DEFECTS_DIR/${name%.patch}.patch"
    [ -f "$p" ] || { echo "no such defect patch: $p" >&2; exit 1; }
    patches+=("$p")
  done
fi

for p in "${patches[@]}"; do
  echo "applying $p"
  git apply --whitespace=nowarn "$p"
done
echo "applied ${#patches[@]} patch(es)"
