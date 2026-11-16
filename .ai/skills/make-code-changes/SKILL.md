---
name: make-code-changes
description: Implement a TypeScript BOM/base framework code change plan from a markdown file (e.g. docs/plans/<slug>-plan.md). Makes every planned change following repo conventions, fixes any TypeScript/ESLint/Prettier issues without changing the plan's intent, runs the new self-tests and the BOM enforcement check, and writes a change manifest md that review-code-changes can consume.
argument-hint: '<path to plan md>'
---

# make-code-changes

Input: path to a plan md (`$ARGUMENTS`). If none is given, list `docs/plans/*.md` and ask which one.

Before starting, read:

- Every file in `.ai/context/` (start with `ai-assistant-instructions.md`) and
  `.ai/skills/_shared/framework-guidelines.md` (rules override everything here)
- The plan in full, plus everything it links to (requirements, `docs/exploration/*` files)
- Every file the plan says to modify, and the neighbouring code you will mirror (an existing
  fixture, base class, config module, client, or self-test of the same kind)
- `.ai/skills/_shared/change-manifest-template.md` — the output format

## Step 1 — Preconditions

- **Exploration gate:** for any new browser/HTTP touchpoint the plan introduces, a matching
  `docs/exploration/<slug>-codegen.ts` must exist and contain evidence for it. If it doesn't,
  stop and run headless exploration first with the `playwright-cli` skill against a local
  fixture/mock (see `.ai/context/self-test-verification-workflow.md` and
  `plan-framework-code-changes` Phase 2) rather than writing it from memory. Never invent a
  locator or a request shape.
- Record baseline: `pnpm --filter <pkg> build`, `pnpm -r lint`, `pnpm --filter <pkg> test -- --list`
  so pre-existing issues aren't attributed to this change.
- If the plan is ambiguous or contradicts a rule in `.ai/context/` or
  `.ai/skills/_shared/framework-guidelines.md`, ask — don't silently pick.

## Step 2 — Implement

Implement exactly what the plan lists, in dependency order: `qe.bom.json` (if a managed version
changes or an override allowance is added) → config → clients/helpers → page objects/components
→ fixtures → self-tests → docs/README.

Conventions (match surrounding code — naming, comment density, TSDoc style):

- Self-tests import `{ test, expect }` from the package's own fixtures module; no raw
  `process.env`; no locators inline in a test body.
- Page objects extend `BasePage`, expose `readonly` `Locator` fields assigned in the constructor,
  and action methods returning `Promise<void>`; include a comment pointer to the exploration file.
- Locators: role/label/`data-test(id)` first; `getByRole('heading', …)` always scoped with `level`.
- A managed dependency's version is changed in exactly one place: the owning `qe.bom.json`'s
  `managed` map. A base package's `package.json` dependency on it is never hand-pinned to a
  different number.
- Every `test()` has `{ tag: ['@<classification>', '@<unique-scenario>'] }`; parametrized tests
  take their unique tag from the data row. No inline `@tag` in titles.
- Web-first assertions (`await expect(locator).toBeVisible()`), no `page.waitForTimeout`, no
  `test.only`.
- No secrets or real PII in code.
- If an existing self-test's behaviour changes, update its tags accordingly.

## Step 3 — Static checks and fix loop

Run on changed files (and the whole affected package for `tsc`):

```bash
pnpm --filter <pkg> exec tsc --noEmit
pnpm --filter <pkg> exec eslint <changed files>
pnpm --filter <pkg> exec prettier --check <changed files>   # fix with: prettier --write
node .ci/enforce-bom-rules.mjs
```

Fix every error/warning **introduced by this change** without altering the plan's intent (don't
delete assertions, loosen types to `any`, add `eslint-disable`, or skip tests to get green). If a
fix would require changing intent, stop and report it. Repeat until clean. Report — don't "fix" —
pre-existing repo-wide issues outside the changed files.

## Step 4 — Run the self-tests

Run **chromium only** — never `firefox`/`webkit` — cross-browser review is a downstream
consumer's own responsibility, not this skill's. Run the new/changed tests by tag, **with the
sandbox override from the start** (never sandboxed first):

```bash
pnpm --filter <pkg> test -- --grep "@<unique-tag>|@<unique-tag-2>" --project=chromium
```

then the plan's full verification commands, keeping any run scoped to `--project=chromium` even
if the plan's command lists other projects. If a test fails, diagnose from the error, trace and
screenshot: fix genuine code defects; for environment issues (see known gaps in
`.ai/context/framework-learnings.md`) report them — don't mask them.

## Step 5 — Write the change manifest

Write `docs/changes/<slug>-changes.md` using `.ai/skills/_shared/change-manifest-template.md`
(the input for `review-code-changes`):

1. Link to the plan, requirements and exploration files.
2. Code change list, per-file details, test coverage table, BOM/dependency changes section.
3. Verification results — exact commands and outcomes for tsc, eslint, prettier, the BOM
   enforcement script, and test runs (pass/fail/skip counts).
4. Deviations from the plan and why; issues fixed during the lint/type loop.
5. Known issues / follow-ups.

Finish by pointing the user at the manifest and suggesting
`review-code-changes docs/changes/<slug>-changes.md`. Do not commit unless the user asks.
