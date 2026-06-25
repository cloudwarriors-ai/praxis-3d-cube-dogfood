#!/usr/bin/env bash
# One-shot generator: produce defects/NN-*.patch from the clean committed baseline.
# Each defect = an exact string replacement; we diff it, save the patch, then revert.
# This script is a build tool for the patch set, not part of the harness runtime.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# clean check
git diff --quiet || { echo "working tree dirty — commit/clean first"; exit 1; }

gen() {
  local name="$1" file="$2" find="$3" repl="$4"
  python3 - "$file" "$find" "$repl" <<'PY'
import sys
path, find, repl = sys.argv[1], sys.argv[2], sys.argv[3]
src = open(path).read()
if find not in src:
    sys.exit(f"FIND not present in {path}: {find!r}")
if src.count(find) != 1:
    sys.exit(f"FIND not unique in {path}: {find!r}")
open(path, "w").write(src.replace(find, repl))
PY
  git diff -- "$file" > "defects/${name}.patch"
  git checkout -- "$file"
  echo "wrote defects/${name}.patch"
}

# 01 — solver returns invalid final state: drop the .reverse() so the inverse
# sequence is applied in the wrong order (correct only for commuting moves).
gen "01-solver-invalid-state" "src/cube/moves.ts" \
  "  return [...tokens].reverse().map(invertMove)" \
  "  return [...tokens].map(invertMove)"

# 02 — validation accepts illegal moves: widen the token regex so any single
# letter is accepted as a face.
gen "02-scramble-illegal-moves" "src/cube/types.ts" \
  "export const MOVE_TOKEN_RE = /^[UDFBLR][2']?\$/" \
  "export const MOVE_TOKEN_RE = /^[A-Za-z][2']?\$/"

# 03 — auto-solve double click: remove the BEGIN_SOLVE re-entrancy guard so a
# second click rebuilds the solution and rewinds progress (duplicates moves).
gen "03-autosolve-double-click" "src/store/cubeStore.ts" \
  "      if (state.isSolving) return state // re-entrancy guard
      if (isSolved(state.cube)) return state" \
  "      if (isSolved(state.cube)) return state"

# 04 — mobile layout clips the move-history panel: collapse the list to zero
# height with hidden overflow at the phone breakpoint.
gen "04-mobile-layout-clip" "src/index.css" \
  "  .move-history__list {
    max-height: 120px;
  }" \
  "  .move-history__list {
    max-height: 0;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }"

# 05 — cube face colors inconsistent after reset: the solved-color reference
# map reports the wrong color for the R face, so post-reset color checks
# disagree with the actual (still-correct) cube state.
gen "05-reset-color-inconsistent" "src/cube/state.ts" \
  "  return { ...FACE_SOLVED_COLORS }" \
  "  return { ...FACE_SOLVED_COLORS, R: 'B' }"

# 06 — README validation command is stale: documents a script that does not
# exist in package.json.
gen "06-stale-readme-command" "README.md" \
  "npm run lint" \
  "npm run lint:all"

echo "all patches generated"
