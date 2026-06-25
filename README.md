# Praxis 3D Cube Dogfood

A 3D Rubik's Cube web app built with Vite + React + TypeScript + Three.js.
Used as a dogfood sandbox for the Praxis orchestration system.

## Validation Commands

Run all checks in sequence to validate the clean state:

```bash
npm run typecheck
npm test
npm run build
npm run lint
```

End-to-end smoke tests (requires a running browser):

```bash
npm run test:e2e
```

## Development

```bash
npm run dev
```

## Architecture

- `src/cube/` — Pure domain logic (state model, move engine, scramble generator, solver). No React or Three.js imports. Fully unit-testable in isolation.
- `src/components/` — React UI components (App, Controls, CubeCanvas, MoveHistory).
- `src/three/` — Three.js rendering layer (CubeRenderer). Receives cube state as plain data.
- `src/store/` — App state reducer (cubeStore). Bridges domain and view.
- `e2e/` — Playwright smoke tests.
- `defects/` — Broken-baseline patch mechanism for the orchestration harness.

## Defects / Broken Baseline

The `defects/` directory contains unified-diff patches that introduce deterministic bugs.

```bash
# Apply all defect patches
bash defects/apply.sh

# Apply a single defect
bash defects/apply.sh 01-solver-invalid-state

# Reset to clean state
bash defects/reset.sh
```

See `defects/manifest.json` for the machine-readable defect catalog.
