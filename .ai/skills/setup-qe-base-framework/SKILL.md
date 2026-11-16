---
name: setup-qe-base-framework
description: Set up (greenfield) or extend/modify (brownfield) the pnpm-workspace BOM/base TypeScript central framework in this repo (which @qe/bom-*-js + @qe/base-*-js package pairs, native Playwright Test runner vs BDD, browsers, registry, CI platform). Asks scoping questions, writes a reviewable plan with diagrams, waits for approval, then implements without breaking existing packages and writes docs/setup-framework.md for code review.
argument-hint: "[optional: answers to the scoping questions, e.g. 'core+api+web+web-cucumber, pnpm, GitHub Packages, GitHub Actions']"
---

# setup-qe-base-framework

Sets up (greenfield) or modifies (brownfield) the `qe-base-js` pnpm-workspace BOM/base monorepo
using the Playwright CLI (`npx playwright ...`) and pnpm. **As of this writing there is no code
in this repo** — the first run of this skill is a greenfield scaffold. Every run after that is
brownfield: extend the monorepo in place, never replace it.

Before starting, read:

- Every file in `.ai/context/` (start with `ai-assistant-instructions.md`) and
  `.ai/skills/_shared/framework-guidelines.md` §1 (the target architecture table) — repo rules
  and learnings override anything below
- `README.md` (once it exists), `pnpm-workspace.yaml`, each package's `package.json`/
  `qe.bom.json`/`tsconfig.json`, `eslint.config.mjs`, the CI files
- `docs/plans/framework-setup-plan.md` if it exists (previous setup decisions)

## Phase 1 — Gather inputs

If the user supplied answers up front (in the prompt or `$ARGUMENTS`), use them and only ask for
what's missing. Otherwise ask the questions **one at a time** (use your tool's
structured-question UI if available, allowing multiple selections for I). Never assume an answer.

| #   | Question                                                 | Options                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I   | Which package pairs should exist? (multi-select)         | a. Core (`@qe/bom-js`+`@qe/base-js` — always, it's the foundation) · b. API testing (`@qe/bom-api-js`+`@qe/base-api-js`) · c. Web/E2E (`@qe/bom-web-js`+`@qe/base-web-js`) · d. Web BDD (`@qe/bom-web-cucumber-js`+`@qe/base-web-cucumber-js`) |
| II  | Self-test authoring/execution style for the web packages | a. Native Playwright Test runner (`@playwright/test`) only · b. Native runner + Cucumber-JS (BDD) via `playwright-bdd` for the cucumber package                                                                                                |
| III | Which browsers/platforms for self-tests? (multi-select)  | Chromium (required — see `.ai/context/self-test-verification-workflow.md`) · Firefox · WebKit                                                                                                                                                  |
| IV  | Registry + CI platform                                   | Registry: GitHub Packages · a private npm registry (name it) · none yet (local-only). CI: GitHub Actions · Jenkins · GitLab CI · Azure DevOps                                                                                                  |

Follow-ups only when an answer makes them necessary (e.g. a private registry → its URL and which
env var carries the auth token; GitLab/Jenkins/Azure CI → whether a `.ci/github/workflows/`
symlink entry is still wanted per `framework-guidelines.md` §1's CI convention).

Record the answers verbatim in the plan.

## Phase 2 — Inventory what exists (brownfield safety)

Before planning, produce a baseline — skip straight to "none exist yet" if this is the
greenfield run:

1. List existing packages, fixtures, config modules, `qe.bom.json` manifests, and CI stages.
2. Record installed versions from the root `package.json` **and** the lockfile
   (`npx playwright --version`, `npx tsc --version`, `pnpm --version`). Every version you pin
   later (a `qe.bom.json` entry, a Docker image tag, an action version) must match these — never
   copy an example value verbatim.
3. Capture the baseline health: `pnpm -r exec tsc --noEmit`, `pnpm -r lint`,
   `pnpm -r exec prettier --check .`, `pnpm -r test -- --list` (listing does not launch browsers),
   `node .ci/enforce-bom-rules.mjs`. Note pre-existing failures so they are not blamed on the new
   change.

## Phase 3 — Write the plan and STOP for approval

Write `docs/plans/framework-setup-plan.md` (if one exists, add a new dated section rather than
overwriting history). It must contain:

1. **Inputs** — answers to I–IV and follow-ups.
2. **Current state** — inventory + baseline health from Phase 2 (or "greenfield — none").
3. **Target architecture** — `pnpm-workspace.yaml` package list and folder tree (existing vs. new
   marked clearly), matching `framework-guidelines.md` §1's target table.
4. **Diagrams (Mermaid)** — at minimum:
   - _Structure diagram_: packages (BOM ↔ base pairs) → fixtures → page objects/API clients/step
     defs → config, utils.
   - _Execution/workflow diagram_: `pnpm --filter <pkg> test` → `playwright.config.ts` → fixture
     setup → test → reporters/artifacts → `qe-bom-guard` → CI stages.
   - _CI pipeline diagram_: install → cache browsers → lint/typecheck/prettier → BOM enforcement
     → sharded self-tests → publish.
5. **Principle mapping** — a table showing how each of principles a–j (`framework-guidelines.md`
   §3) is satisfied (file + mechanism).
6. **Change list** — every file to be created/modified, with purpose; new dependencies with the
   exact version, which `qe.bom.json` manages them, and the CLI commands to be run (e.g.
   `npm init playwright@latest` inside each web-ish package — note `--gha` is presence-only;
   omit it for non-GitHub CI).
7. **Backward-compatibility guarantees** — how existing packages, fixtures, env vars, projects
   and CI keep working (e.g. new packages use separate `testMatch`; new env vars are additive).
8. **Risks & open questions.**

Then **stop and ask the user to review/approve** the plan. Do not change any framework file
before explicit approval. If the user requests changes, update the plan and ask again.

## Phase 4 — Implement (only after approval)

Implement exactly the approved plan, using the Playwright CLI where it applies
(`npm init playwright@latest`, `npx playwright install --with-deps`, etc.) and pnpm for
everything else. Conventions:

- **Workspace**: `pnpm-workspace.yaml` lists `packages/*`; root `package.json` carries shared
  devDependencies (`typescript`, `eslint`, `prettier`, their plugins) and workspace-wide scripts
  (`build`, `test`, `lint`, `bom:check` → `node .ci/enforce-bom-rules.mjs`).
- **BOM packages first**: each `packages/bom-*-js/package.json` + `qe.bom.json` (§5 of
  `framework-guidelines.md`) before its paired base package, so the base package's dependencies
  have something to match against from the start.
- **Base package architecture**: public surface only through `src/index.ts`; locators only in
  page objects/components (web packages); API clients extend a shared base client class; every
  custom fixture via `test.extend`; self-tests import `{ test, expect }` from the package's own
  fixtures module.
- **Config**: every env var goes through a typed, Zod-validated config module per package;
  nothing else reads `process.env`.
- **Projects**: one Playwright project per browser; each capability gets its own
  `testDir`/`testMatch` so existing projects are unaffected.
- **BDD**: `playwright-bdd`'s `defineBddConfig`, features under `features/`, step defs reuse the
  same fixtures.
- **Reliability**: no `page.waitForTimeout`; web-first assertions; retries on CI only;
  `forbidOnly` on CI.
- **Reporting**: HTML + JUnit reporters; trace/video/screenshot retained on failure.
- **Tags**: any sample/self-test added carries `tag: ['@<classification>', '@<unique-scenario>']`.
- **CI**: headless, `pnpm install --frozen-lockfile`, browser caching or the official
  `mcr.microsoft.com/playwright:v<installed-version>-<distro>` image, lint + typecheck + prettier
  - BOM-enforcement gates, sharding, report publishing, secrets from the CI secret store only.
    Real workflow file at `.github/workflows/ci.yml` if GitHub Actions is chosen (see
    `framework-guidelines.md` §1's CI-convention note on why the symlink direction matters).
- **Security**: no secrets committed; update `.gitignore` if new report/auth dirs are introduced.
- Create/update `README.md` for any new command, env var, package or consumption pattern.

## Phase 5 — Verify nothing broke

Run and compare against the Phase 2 baseline:

- `pnpm -r exec tsc --noEmit`
- `pnpm -r lint`
- `pnpm -r exec prettier --check <changed files>`
- `pnpm -r test -- --list` (all previously listed tests still listed, plus new ones)
- `node .ci/enforce-bom-rules.mjs`
- Run any new sample test and a representative existing test **with the sandbox override from
  the start**. Do not try sandboxed first.

Any new failure introduced by the change must be fixed. Pre-existing failures and known
environment gaps (`.ai/context/framework-learnings.md`) are reported, not "fixed" by weakening
tests.

## Phase 6 — Write `docs/setup-framework.md`

This is the hand-off for the `review-code-changes` skill / `code-review-agent`. Include:

1. Summary and link to `docs/plans/framework-setup-plan.md`.
2. Inputs (I–IV answers).
3. **Code change list** — table: `File | Change type (added/modified/deleted) | Purpose | Principle(s)`.
4. For every modified pre-existing file: a short before/after or diff excerpt and why it is
   backward compatible.
5. New dependencies and versions (verified against the lockfile), and which `qe.bom.json` each
   lands in.
6. Commands executed (CLI) and verification results (typecheck, lint, prettier, BOM enforcement,
   `--list`, test runs) with pass/fail counts.
7. Deviations from the approved plan, with reasons.
8. Known issues / follow-ups for the contributor (e.g. registry token to configure in CI).

Finish by telling the user where the plan and change log are, and suggesting
`review-code-changes docs/setup-framework.md` as the next step. If this run surfaced a new,
non-obvious learning, propose adding it to `.ai/context/framework-learnings.md`.
