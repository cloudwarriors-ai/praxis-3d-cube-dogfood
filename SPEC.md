# Praxis 3D Cube Dogfood — Canonical Specification

This file describes the accepted current state of `praxis-3d-cube-dogfood`. It is
canonical for product behavior and repository architecture. The dated adoption report
under `docs/adoption/` records the evidence and gaps found when this contract was added.

## 1. Purpose and scope

The repository is a deliberately small dogfood application for exercising engineering
orchestration. Its product surface is a client-only 3D Rubik's Cube built with React,
TypeScript, Vite, and Three.js. Its harness surface supplies deterministic defect patches
so automation can be evaluated against real, test-caught changes. Retired GitHub Autopilot
and preview assets remain only as reference material.

The application is not a general cube-solving service, a persistence system, or a
production release orchestrator. The retired GitHub Autopilot assets are not the AI
Battlestation. Battlestation authority begins only after this repository's committed
contract is explicitly bound and its preflight passes.

## 2. Accepted product behavior

1. The page renders a titled, draggable 3D cube, controls, solve status, and move history.
2. Initial state is a solved cube with an empty history.
3. Scramble produces a deterministic 20-move sequence for a supplied seed, applies only
   valid face moves, marks the cube scrambled, and displays the moves.
4. Reset returns cube state, history, solution state, errors, and move count to the solved
   baseline.
5. Step Solve and Auto Solve invert the recorded scramble. The proposed sequence is
   verified against cube state before it is used. Auto Solve advances at one move per
   300 ms and ignores re-entrant starts.
6. The cube may be rotated by mouse or touch without changing logical cube state.
7. The controls and move history remain visible and usable at the tested phone viewport.
8. The text `preview-gate harness: hold` is intentionally visible. It is a dogfood marker,
   not customer copy.
9. Errors from solution construction are rendered in the application instead of being
   silently discarded.

## 3. Architecture and ownership

The browser entry point is `src/main.tsx`; `src/components/App.tsx` owns UI orchestration.
The repository has four application modules:

- `src/cube/` owns cube types, solved state, legal moves, scrambling, and the inverse-
  scramble solver. It is pure TypeScript and must not depend on React or Three.js.
- `src/store/` owns the reducer state machine that joins domain operations to UI actions.
- `src/components/` owns the React view and user interactions. It consumes the reducer and
  passes plain cube data to the renderer.
- `src/three/` owns scene, mesh, color, resize, pointer, touch, and render-loop behavior.
  It must not become the owner of logical cube state.

`src/cube/__tests__/` and `src/store/__tests__/` provide unit coverage. `e2e/` owns real
browser behavior. `defects/` is test-harness data, not application runtime code.
`.autopilot/` and the preview scripts are inactive artifacts from the retired GitHub
Autopilot harness. They are not reused implicitly by new automation.

## 4. State and data contracts

All product state is ephemeral browser memory. The app has no API, database, accounts,
authentication, analytics, cookies, or local-storage contract. A refresh starts a new
solved cube.

Cube state is six faces with nine validated colors per face. Valid moves are the six face
letters with an optional prime or double-turn suffix. The current solver is authoritative
only for states derived from the scramble sequence retained in the reducer; arbitrary
unknown-origin cube states are outside the accepted contract.

Repository source and GitHub issue metadata are PUBLIC: the repository and its issue
tracker are publicly visible. The app itself handles no customer data and no secrets.
GitHub, SSH, Docker, Tailscale, and AI-provider credentials are RESTRICTED and belong to
their external execution environments. They must remain references, never values in
source, task text, logs, preview URLs, Git remotes, or artifacts.

## 5. Dogfood and preview contracts

`defects/manifest.json` maps deterministic reports to patches, expected failing tests,
and expected fixes. Defect branches may intentionally be red; `dev` is the clean
integration baseline and must be verified before new experiments are cut from it.

The repository no longer contains the legacy GitHub intake, AI runner, or preview-teardown
workflows. This removes their public trigger, PAT dispatch, inherited-secret, mutable
downstream-code, and production-base paths from the accepted `dev` state. Repository-level
workflow disablement prevents the default branch's older copies from running before a
separate human-owned production promotion retires them from `main`.

`battlestation.json` is the repository-owned autonomous-development contract. It uses
honest `advisory-v1` governance because this repository has no server-enforced rulesets.
It allows verified automatic integration to `dev` only, declares no deployment or
rollback authority, denies local-model write access, and keeps production promotion
human-only.

The retired preview scripts can build an exact commit into a static nginx container and
publish it to tailnet members. They are not part of Battlestation authority or the current
automated workflow. Their credential-handling defects remain documented so they are not
reactivated accidentally.

## 6. Verification contract

`.claude/verification.json` is the executable verification source of truth.

- FAST is intentionally undeclared. The repository has cheap static checks but no observed
  application-start or vital-runtime heartbeat, so labeling those checks FAST would
  overstate their evidence.
- MODULE `cube-domain` proves the pure cube engine.
- MODULE `app-state` proves the reducer and application state transitions.
- MODULE `automation-contract` proves the `dev`/`main` authority boundary, required CI
  check availability for both pull-request bases, and retirement of legacy workflows.
- MODULE `frontend` proves build plus desktop/mobile browser behavior and marks the browser
  check for browser-proof routing.
- FULL repeats repository checks, real browser tests, and the production-dependency audit.

Playwright requires its pinned Chromium build. A missing browser binary is an environment
failure, not product evidence; install it with `npx playwright install chromium` before
rerunning. Preview deployment and teardown are not part of local verification because
they mutate remote Docker and Tailscale state.

## 7. Branch, integration, and release state

`dev` is the integration branch and `main` is the production branch. Neither branch has
server-enforced protection. The `verify` workflow runs the declared typecheck, unit,
lint, build, Chromium browser, and production-dependency checks on pull requests to `dev`
and again on the exact merged `dev` commit. The advisory contract names that check, but
GitHub does not enforce it; Battlestation must verify the exact SHA itself.

Live GitHub reports that the repository is public and that Actions defaults grant write
permission and pull-request approval. These facts mean a green local or agent run is
evidence, not a server-enforced gate, and public event triggers require explicit caller
authorization before they may reach any secret-bearing workflow.
Automated integration into `dev` must remain governed by the active execution system's
own exact-SHA checks. Promotion from `dev` to `main` is separate, human-owned release
work; no autonomous system may merge `main`.

## 8. Security and trust boundaries

The shipped artifact is static and has no server-side authority. The important trust
boundary is the automation and preview tooling, which can clone private source, build
containers, publish a tailnet route, and consume inherited GitHub secrets.

The preview script currently embeds `GITHUB_TOKEN` in an HTTPS clone URL when that
environment variable is present. Because the cloned workspace survives until teardown,
the token-bearing remote URL can survive in its Git configuration. That is a known defect;
do not treat this path as suitable for new unattended execution until credential-safe
clone authentication is implemented and verified.

The installed production dependency graph reports no npm vulnerabilities. The development
toolchain currently reports 11 audit findings, including 2 critical findings. Those are
not shipped to the static browser artifact, but they remain relevant to CI and agent
execution and must be remediated as a separate dependency change.

The former public `/autofix` and privileged legacy runner paths are retired from `dev` and
disabled at repository level. Battlestation does not use their scripts, PAT, inherited
secrets, reusable workflows, or preview infrastructure.

## 9. Observability

The browser app has no telemetry or error export. Preview operations emit step logs,
container labels for repository/issue/SHA/mode/creation time, an HTTP readiness result,
and a stable preview URL. There is no SLO, alerting, incident Case integration, or durable
preview-status API in this repository.

## 10. Known limitations

- Exact current state is not covered by server-enforced branch protection; the declared
  CI gate is advisory and Battlestation must enforce exact-SHA evidence itself.
- Organization secrets and write-capable Actions defaults remain configured outside this
  repository even though the retired workflows that consumed them are disabled.
- Preview clone authentication can persist a credential value in temporary Git metadata.
- Development-only dependencies have known high/critical audit findings.
- The build emits a large-chunk warning for the approximately 616 kB JavaScript bundle.
- The interactive canvas has no accessible name, role, focus target, or keyboard rotation;
  the core interaction is inaccessible to keyboard-only users. Browser coverage also lacks
  a complete accessibility audit, Firefox/WebKit matrix, and visual-regression suite.
- The defect manifest's baseline-count prose is stale relative to the current 65 unit and
  14 browser tests.
- The app deliberately does not persist state or solve arbitrary unknown-origin cubes.
- Operational telemetry and incident handling are limited to preview step logs/readiness.
