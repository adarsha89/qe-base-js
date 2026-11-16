---
name: plan-framework-code-changes
description: Plan TypeScript BOM/base framework code changes for a package (or a new managed dependency). Collects affected packages, compatibility constraints and known contracts, explores any new browser/HTTP touchpoint headless with the playwright-cli skill against local stubs, then writes a parametrized, high-coverage plan with Mermaid diagrams to docs/plans/<slug>-plan.md for review. Does not write code.
argument-hint: '[change description, requirements md path, affected package(s)]'
---

# plan-framework-code-changes

Produces a reviewable code-change plan. **Plans only — no changes to `packages/**/src`,
`qe.bom.json`, `pnpm-workspace.yaml`, or any package's `package.json`.** The `make-code-changes`
skill implements it.

**[NON-NEGOTIABLE] For any change that introduces a new browser or HTTP touchpoint, explore the
local fixture/mock with the `playwright-cli` skill before any other planning work on that
scope** — before designing coverage (Phase 3) and before writing the plan (Phase 4). Never plan a
locator, a request shape, or a fixture from memory or a design doc alone — there is no live
external target in this repo, only local stubs/mocks.

Before starting, read:

- Every file in `.ai/context/` (start with `ai-assistant-instructions.md`) and
  `.ai/skills/_shared/framework-guidelines.md` (rules override everything here)
- The existing framework in the affected package(s): its fixtures/base classes, config module,
  `src/index.ts` public surface, existing self-tests, `playwright.config.ts`
- `docs/requirements/<slug>-requirements.md` if `analyze-task` produced one — treat it as the
  primary source of goals and acceptance criteria

## Phase 1 — Gather inputs

Use anything already provided. Ask for the rest **one question at a time** (structured-question UI
where available). Never invent answers.

1. **Which package(s)** this touches, and whether it's purely a `@qe/bom-*-js` version bump, a
   `@qe/base-*-js` code change, or both.
2. **Contract/behaviour source of truth** — for a new browser touchpoint, which local
   fixture/mock page to build; for a new HTTP client capability, the API contract (OpenAPI,
   sample request/response, or the real third-party API's published docs if the base package is
   a thin typed wrapper around it).
3. **Compatibility constraints** — is this additive (safe minor/patch) or breaking (major, needs
   every downstream consumer's attention)? Any existing consumer behaviour that must not change?
4. **Classification/tagging** — which classification tag(s) (`@unit`, `@integration`, `@bom`,
   `@framework`) the new self-tests need.

Derive a kebab-case `<slug>` and confirm it.

## Phase 2 — Explore (always do this first for a new browser/HTTP touchpoint, before any planning)

Per `.ai/context/self-test-verification-workflow.md` [TEMPERATURE 0 — NON-NEGOTIABLE] and the rule
above, explore the relevant local fixture/mock with the `playwright-cli` skill instead of
`npx playwright codegen`, **before** Phase 3 (design coverage) and Phase 4 (write the plan):

- `playwright-cli open <local-fixture-url>` **headless** (never `--headed`), then drive every
  state in scope with `playwright-cli snapshot` / `click` / `fill` / `select` / etc. Every action
  prints the equivalent Playwright TypeScript; collect it as you go.
- Hand-author `docs/exploration/<slug>-codegen.ts` from the collected generated code, with a
  comment block at the top disclosing it was produced via `playwright-cli` sessions.
- Confirm each candidate locator before trusting it: `playwright-cli generate-locator <ref>` for
  the final locator expression. Never guess a locator.
- For an HTTP client capability: exercise the local mock server (sandbox override if it binds a
  real port) to confirm request shape, status codes, response schema, and error payloads. Never
  assume a response shape.

## Phase 3 — Design coverage

Build a **test-case matrix** — every row traces to a requirement, a user-provided expectation,
or an observed behaviour from exploration:

| ID | Scenario | Type (positive/negative/boundary/state) | Data (parametrized set) | Assertions | Tags (classification + unique) | Source |

Coverage rules:

- Parametrize instead of duplicating (`for (const c of CASES) test(...)`), each generated test
  still getting its **own unique tag** from the data row.
- Cover positive, negative, boundary/equivalence classes, state transitions, error handling, and
  (for an API-facing package) schema validation (Zod), status codes and auth failures.
- Don't pad: every case must be justified by a source. List plausible-but-unconfirmed cases
  separately under "Candidate cases — needs confirmation".
- Unique tags must not collide with existing ones — `grep -rn "@<tag>" packages/*/src` to check.

## Phase 4 — Write the plan

Write `docs/plans/<slug>-plan.md` containing:

1. **Overview** — goal, scope, out of scope, links to requirements/exploration.
2. **Inputs received** — summary of each answer from Phase 1.
3. **Exploration findings** — local fixtures/endpoints, verified locators/request shapes table
   (element/field → locator/schema → evidence line in codegen file).
4. **Diagrams (Mermaid)**:
   - _Structure_: which packages, modules, fixtures, clients, config are involved (new vs. existing).
   - _Workflow_: the flow under change (sequence or flowchart), including where each assertion happens.
   - _BOM impact_: which `qe.bom.json` `managed`/`overridable` entries are added/changed, and which base package(s) consume them.
5. **Test-case matrix** (Phase 3) and parametrization strategy.
6. **Code change list** — per file: path, create/modify, exact responsibilities (export/class/
   function/fixture names and signatures), and which principle(s) a–j it serves (see
   `.ai/skills/_shared/framework-guidelines.md` §3). Include `qe.bom.json` changes and
   `README.md` updates.
7. **Tagging plan** — classification tags, unique tags per test, grep commands to run subsets.
8. **Compatibility & security** — breaking vs. additive, downstream migration notes if breaking;
   secrets needed (env var names only, never values).
9. **Reliability notes** — waiting strategy, isolation, flakiness risks.
10. **Verification plan** — `pnpm --filter <pkg> build`, `pnpm -r lint`, `pnpm -r exec tsc --noEmit`,
    `node .ci/enforce-bom-rules.mjs`, and the exact
    `pnpm --filter <pkg> test -- --grep @<tag> --project=chromium` commands (to be run with the
    sandbox override). Verification is **chromium-only** — cross-browser is a downstream
    consumer's own responsibility, not part of this plan's verification commands.
11. **Risks, assumptions, open questions.**

## Phase 5 — Hand off

Summarise the plan in a few lines, give its path, and ask the user to review. Next step after
approval: `make-code-changes docs/plans/<slug>-plan.md`.
