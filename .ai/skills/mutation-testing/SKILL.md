---
name: mutation-testing
description: Plan, implement, run, and analyze controlled mutations against this framework's own base-package logic (fixtures, browser/context factory, API client, config loaders, retry helper, BasePage, …), validated against each package's existing self-tests, to find assertion gaps. Use when evaluating self-test effectiveness, building mutation hooks, or reporting mutation campaign results.
---

# Mutation Testing

## What gets mutated here

This repo has no live external target and no end-to-end test suite against an application — its
"tests" are each base package's own self-test suite, run against local stubs/mocks (per
`.ai/skills/_shared/framework-guidelines.md` §1). Mutation testing here means injecting
controlled defects into the framework's own `src/` logic (a fixture, the browser/context
factory, the API client wrapper, a config module, the retry helper, `BasePage`, wait helpers, …)
and checking whether that package's own self-test suite catches the defect. A web layer and an
API layer both genuinely exist once `@qe/base-web-js`/`@qe/base-api-js` are scaffolded — don't
claim either is unsupported without checking, and equally don't fabricate a layer (e.g. a live
external API) that doesn't exist here.

This is **not** StrykerJS's (or any tool's) automatic mutant-generation engine — it's a
deliberately deterministic, hand-wired system, mirroring the sibling Java repo's own
PIT-shaped-but-custom approach: every mutation is bound to one specific existing test, gated by
one env var, and never auto-generates new mutants you'd have to triage.

## Test priorities and mutation expectations

Give every existing self-test a priority classification tag — `@p0`, `@p1`, `@p2`, or `@p3`, in
the same `tag` array as its classification/unique tags (`@p0` highest risk/importance, `@p3`
lowest; see `.ai/context/test-tagging.md`). Every `@p0`, `@p1`, and `@p2` test must have at least
one deterministic mutation entry in `src/__mutation__/mutation-test-map.csv` (one per package
that opts in) and an opt-in mutation binding on that existing test. `@p3` tests may remain
unmapped.

Each map row must name the existing test file + test title, the intentional mutated behavior,
and an independently grounded expected assertion. The expectation must be strong enough that the
normal assertion necessarily fails for the specified defect (for example, an exact worker-id/
fixture value, a required browser-context option, an exact JSON field mapping, or an exact retry
count). The unmutated fixture must pass that same assertion first. Never convert an assertion
into a check that accepts the mutated value, or add a mutation-only test whose success means the
defect was detected.

Use this workflow to evaluate whether existing package self-tests detect intentional, controlled
defects in the framework's own logic. Keep the repository's ordinary test path unchanged when
mutation mode is off. A mutation represents a defect in the framework code under test; do not
weaken or edit an assertion just to make a mutant fail.

## Mutate existing tests, never add mutation tests

Mutations are wired into the **existing** self-test cases. Do not create new test files, test
titles, or mutation-only suites that copy an existing test's setup and assertions. The existing
test is the subject under evaluation: it keeps its own setup, data, and assertions, and only the
defect is injected into the `src/` code it exercises.

- **Switch:** mutation runs only when the `MUTATION_ENABLED` environment variable is `true`
  (case-insensitive). Missing, blank, or any other value means disabled.
- **Disabled is a no-op:** with `MUTATION_ENABLED` unset or `false`, every modified test must
  behave exactly as before. No extra fixture state, browser behavior change, or extra request.
- Mutation mode defaults to disabled; enable it explicitly with
  `MUTATION_ENABLED=true pnpm --filter <pkg> test`.
- **Selection:** bind each mutation to an existing test via the mutation-to-test map and select
  those tests through Playwright Test's own `--grep`. Unmapped tests remain unchanged; never
  activate random mutations.
- **Minimal test edits:** prefer a shared hook (a fixture, the browser factory, the API client,
  a config module, or a retry helper that existing tests already pass through) over editing the
  test body. Where a test must change, add only a declarative mutation binding (for example a
  mutation ID passed to a fixture option). Never edit, weaken, or remove an assertion, expected
  value, or data table row.
- **Migration:** if the repo already holds mutation-only tests that duplicate existing ones, move
  each mutation onto the existing test it challenges, update the mutation-to-test map to point at
  that test, and remove the duplicate only after the migrated mutation is validated.

This skill is model- and tool-neutral. Discover the actual package internals, fixtures, and
agent conventions before choosing an implementation. Do not assume a particular design beyond
what `.ai/skills/_shared/framework-guidelines.md` documents. The catalog and lifecycle references
are loaded as needed:

- Read [hook-design.md](references/hook-design.md) when planning or implementing mutation
  infrastructure.
- Read [mutation-catalog.md](references/mutation-catalog.md) when selecting operators or targets.
- Read [results-and-reporting.md](references/results-and-reporting.md) when collecting results,
  classifying outcomes, or preparing a report.

## Modes

Support these modes independently; do not run a campaign merely because hooks were created.

- **ANALYZE:** Inspect tests, expected behavior, and mutation points. Produce a traceable plan
  without changing files.
- **GENERATE:** Implement selected mutation definitions and the smallest missing hooks, and bind
  them to the existing tests they challenge, gated by `MUTATION_ENABLED`. Do not create new test
  cases. Do not run a full campaign unless requested.
- **VALIDATE:** Check configuration, matching, activation, isolation, cleanup, and focused
  examples.
- **RUN:** Establish baseline health, run selected tests with one mutation per isolated
  execution, and capture evidence.
- **REPORT:** Analyze existing campaign results without changing tests or infrastructure.
- **IMPROVE:** Explain gaps and propose test improvements. Implement them only when the request
  includes code changes; preserve original expectations and verify baseline and mutated behavior
  separately.

## Workflow

1. **Discover.** Read `.ai/skills/_shared/framework-guidelines.md` and inspect each affected
   package's fixtures, config module, client/browser-factory classes, self-test entry points,
   assertions, local stub/mock setup, and tag conventions. Identify which packages are in scope
   and treat any package you haven't inspected as unsupported for now.
2. **Inventory.** Select critical `src/` behaviors and record each test ID, behavior, expected
   result, evidence source (the current source code and its own self-test), relevant target
   module/function, and candidate mutation. Do not invent expected behavior.
3. **Plan.** Before substantial infrastructure changes, present a concise design and
   implementation plan. Prefer existing framework extension points (the fixtures' own hooks) and
   the smallest maintainable implementation. Separate infrastructure creation from campaign
   execution.
4. **Implement.** Add a shared controller/registry with layer-specific adapters only where
   supported (fixture/browser/client/util), then bind each mutation to the existing test it
   challenges (shared hook first, declarative binding second). Keep activation explicit through
   `MUTATION_ENABLED`, deterministic, test-scoped, and disabled by default. Keep mutation code
   out of the normal `src/` execution path where the framework permits (a module-private hook
   guarded by the env var, not a change to the package's public `src/index.ts` surface).
5. **Validate.** Run each modified test with `MUTATION_ENABLED` unset and `false` and confirm the
   outcome is unchanged. Confirm that a selected mutation applies only to its intended
   module/function, that other modules' behavior remains unchanged, and that cleanup runs after
   success, failure, and timeout. Use focused infrastructure checks and at least one existing-test
   example per package in scope.
6. **Run.** Run each relevant existing test with `MUTATION_ENABLED=false` first (baseline).
   Skip mutation evaluation when its baseline is unhealthy. Re-run the same test with
   `MUTATION_ENABLED=true` and exactly one selected mutation in an isolated run, collect
   failure/assertion evidence, then verify cleanup before the next run. Parallelize only when
   mutation state is isolated per worker.
7. **Report.** Use [results-and-reporting.md](references/results-and-reporting.md) to classify
   outcomes, calculate metrics, and connect each mutation to the tests and assertions that
   evaluated it. Separate self-test gaps from invalid setup (e.g. a sandboxed environment
   blocking browser launch) and unrelated infrastructure failures.

## Operating constraints

- Mutation execution is opt-in through `MUTATION_ENABLED=true`. Apply only the mutation bound to
  the current existing test; unmapped tests remain unchanged.
- Never create new test cases to host a mutation. Modify the existing test's execution path only,
  and keep its assertions and expected values intact.
- All targets in this repo are local (local browser sessions, local mock servers, in-process
  utility modules) — there is no production or shared environment to guard against. Still
  require the environment guard in the hook design (a future package might add one), and never
  disable TLS or auth globally to make a mutation work.
- Never log secrets, tokens, or personal data (none should exist in this repo's local fixtures in
  the first place — treat any that appears as a separate finding).
- Do not change existing tests to detect or assert on mutation IDs. A mutation binding may tell
  the hook which defect to inject, but the test must still use its normal calls and assertions.
- Do not count an unrelated failure (e.g. a sandbox blocking browser process spawn) as a killed
  mutation. A killed result must be attributable to the selected defect.
- Do not claim framework logic was mutated when only a log message or non-functional detail
  changed. Name the actual mutation layer (fixture/browser/client/util/retry).
- If a layer or target cannot be safely intercepted, report it as unsupported or invalid and
  recommend the closest safe alternative. Do not create empty hooks or claim acceptance criteria
  passed without evidence.

## Completion summary

Report paths changed, packages/layers supported, mutation/test linkage (which existing test each
mutation is bound to), disabled-mode (`MUTATION_ENABLED` off) validation, baseline and campaign
results, limitations, and validation performed. Distinguish built infrastructure from actually
executed examples. Do not claim a mutation score for incomplete or invalid campaigns.
