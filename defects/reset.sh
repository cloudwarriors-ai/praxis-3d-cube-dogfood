#!/usr/bin/env bash
# Reset the source tree back to the clean committed baseline (discard any
# applied defect patches). Untracked files (e.g. the defects/ patches
# themselves) are left untouched.
set -euo pipefail
cd "$(dirname "$0")/.."

# Restore all tracked, modified files to HEAD. Defect patches only touch
# tracked source files, so this fully reverts an apply.sh run.
git checkout -- .
echo "reset to clean baseline (HEAD: $(git rev-parse --short HEAD))"
