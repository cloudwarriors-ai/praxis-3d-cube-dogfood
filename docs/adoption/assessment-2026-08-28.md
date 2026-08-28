# Adoption assessment — Praxis 3D Cube Dogfood

- Repository: `cloudwarriors-ai/praxis-3d-cube-dogfood`
- Assessed baseline: `origin/dev` at `5c6ea32`
- Date: 2026-08-28
- Ownership: first-party CloudWarriors repository
- Plane: CloudWarriors organizational engineering plane
- Live state: public repository and public issue tracker with per-issue development
  previews; no persistent production deployment was established from repository evidence.

This is a dated assessment of the baseline before adoption artifacts. `SPEC.md` is the
canonical description after this change.

## Baseline evidence

- Runtime and entry points: Vite/React/TypeScript/Three.js in `package.json:1-42` and
  `src/main.tsx`.
- Existing validation commands: README lines 6-21 and `package.json:6-15`.
- Unit baseline: `npm test` passed 65 tests in 2 files.
- Static baseline: typecheck, production build, and lint passed. Build warned that the main
  JavaScript chunk is approximately 616 kB.
- Browser baseline: the first run was UNVERIFIED because the pinned Playwright Chromium
  executable was absent. After `npx playwright install chromium`, all 14 desktop/mobile
  Playwright tests passed.
- Dependency baseline: `npm audit --omit=dev --audit-level=moderate` passed with zero
  production findings. The full development graph reports 11 findings: 3 moderate,
  6 high, and 2 critical.
- Branch state: `dev` and `main` both exist and neither is protected by a GitHub ruleset.
- Visibility and token defaults: live GitHub reports `visibility: public`, issues enabled,
  default workflow permission `write`, and pull-request approval enabled.
- Automation state: three active GitHub workflows provide intake, a shared external runner,
  and preview teardown. There is no general validation CI workflow.
- Public automation boundary: any issue commenter can satisfy the `/autofix` condition
  (`autopilot-intake.yml:31-34`) without an identity/association check. Dispatch then uses
  `WORKFLOW_PAT` (`:267-291`); the runner consumes a mutable feature-branch workflow with
  `secrets: inherit` (`autopilot-runner.yml:32-43`). Live organization metadata reports
  AI-provider keys and the workflow PAT available to all repositories.
- No secret value was observed in source. `scripts/preview-deploy.sh:37-39` constructs a
  token-bearing clone URL by reference when `GITHUB_TOKEN` is present.
- No repository-scoped `AGENTS.md`, `CLAUDE.md`, or competing local policy was present.

## Ten-Standard gap report

| Standard | Current evidence | Gap / classification | Cost |
|---|---|---|---|
| 1 — Engineering Constitution | Source is small, typed, and covered by real tests; README names actual commands. | **Defect:** `defects/manifest.json:3` still claims 56 unit/12 e2e while the current suites contain 65/14. | S |
| 2 — Architecture Contract | `README.md:29-36` and import boundaries show a clean cube/store/components/Three separation. | **Adoption gap:** no canonical accepted-current-state SPEC existed. Addressed by this change. | S |
| 3 — Execution Orchestration | Intake has concurrency, skip/disable controls, deterministic issue branches, and an external shared runner; preview auto-merge is off. | **Defect:** public `/autofix` comments require no caller authorization before PAT-backed dispatch into a mutable, secret-inheriting runner. This is separate from Battlestation and NOT READY. | M |
| 4 — Verification & Evidence | Typecheck, 65 unit tests, build, lint, and 14 browser tests all passed after browser bootstrap. | **Adoption gap:** no verification profile existed. Addressed with MODULE/FULL; FAST remains honestly undeclared because no runtime heartbeat exists. | S |
| 5 — Runtime & Enforcement | No competing repo-local agent policy was found; global foundation policy remains singular. | **Satisfied** for repository policy ownership. No claim is made about every external runner host. | — |
| 6 — Promotion & Release | `dev` and `main` exist. `.autopilot/config.json:20-30` keeps preview gate on and auto-merge off. | **Adoption gap:** neither branch is protected, required checks are empty, and no general CI validates PRs. | M |
| 7 — Observability & Incidents | Preview logs expose phases, readiness, exact SHA labels, URL, and teardown behavior (`scripts/preview-deploy.sh:42-105`). | **Accepted limitation:** no SLO, alerting, Case lifecycle, durable preview status, or browser telemetry exists. | M |
| 8 — Security, Identity & Data | Public source/issues are classified PUBLIC; the static product holds no customer data; tailnet preview is default and production dependency audit is clean. | **Defect:** the public trigger reaches broad token/secret authority; token-in-URL preview clones can persist credentials in `/tmp`; development tooling has 11 findings including 2 critical. | M |
| 9 — AI / LLM Engineering | `.github/workflows/autopilot-runner.yml:32-43` delegates to a mutable shared AI runner with inherited secrets and bounded turn/cost inputs. | **Defect / NOT READY:** no repository-local behavioral eval or authority proof exists, and public callers can reach its dispatch path. | M |
| 10 — Frontend & Human Interface | Semantic heading/buttons, responsive layout, touch/mouse rotation, desktop/mobile behavior, and core status transitions are browser-tested. | **Defect:** the interactive canvas lacks an accessible name/role/focus target and keyboard interaction; broader accessibility, browser, and visual proof is also absent. | M |

**Classification:** 5 defect · 3 adoption gap · 1 accepted limitation · 1 satisfied.

## Artifacts written

- `SPEC.md` — accepted current product, architecture, security, automation, release, and
  limitation contract.
- `.claude/verification.json` — MODULE (`cube-domain`, `app-state`, `frontend`) and FULL
  profiles containing only commands observed passing; FAST intentionally undeclared.

## Remediation ladder

Each item is a separate change through the normal foundation loop.

1. Disable or authorize the public `/autofix` comment trigger, pin the reusable workflow to
   an immutable reviewed ref, restrict workflow permissions/PR approval, and narrow org
   secret availability before any new unattended run — Standards 3/8/9 — M.
2. Replace token-bearing preview clone URLs with credential-safe Git authentication and
   prove temporary workspaces/remotes contain no credential value — Standard 8 — M.
3. Add ordinary PR/`dev` CI for the declared verification commands, then bind required
   exact-SHA checks without enabling production automation — Standards 4/6 — M.
4. Add the local Battlestation project/repository binding and preserve the existing GitHub
   Autopilot path as explicitly separate until migration is deliberate — Standard 3 — S.
5. Upgrade development dependencies in a bounded dependency change; rerun FULL and the
   defect harness — Standards 1/8 — M.
6. Add behavioral eval evidence before granting any new unattended write/review/merge
   authority to the legacy AI runner — Standard 9 — M.
7. Make the interactive canvas operable by keyboard with a programmatic name and focus
   contract, then add browser accessibility assertions — Standard 10 — M.
8. Refresh the defect catalog baseline counts and add a consistency assertion so the
   machine-readable harness cannot silently drift — Standards 1/4 — S.
9. Broaden Firefox/WebKit and visual coverage only when UI work warrants it — Standard 10 — M.
10. Add durable preview status and cleanup evidence if previews become an operational
   dependency instead of a bounded dogfood aid — Standard 7 — M.

## Decisions retained for the owner

- Whether the pre-existing GitHub Autopilot path will be retired, retained as a comparison
  lane, or migrated after Battlestation dogfood proves the replacement.
- Whether the public repository/issue tracker is intentional. This assessment classifies
  them PUBLIC because that is the enforced state; making them INTERNAL requires changing
  repository visibility as a separate owner decision.
- When to add server-enforced protection to `dev` and `main`; this adoption does not invent
  gates that GitHub does not currently enforce.
- Whether the legacy public preview mode should be removed after tailnet-only dogfood is
  proven sufficient.
