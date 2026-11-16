# Mutation Catalog

Candidate mutation operators for this framework's layers, grouped by where they apply. Use this
as a menu, not a checklist to exhaust — only add a mutation that has a `@p0`/`@p1`/`@p2` test
capable of catching it.

## Core (`@qe/base-js`)

- **Fixture lifecycle**: skip teardown; swap setup order; return a stale/shared instance instead
  of a fresh one per test/worker.
- **Config resolver**: swap a default value; drop env-var validation (accept an invalid value
  that Zod should reject); off-by-one on a numeric default (timeout, retry count).
- **Retry helper**: off-by-one on retry count; retry on a non-retryable error class; swap
  exponential backoff for a fixed/zero delay; swallow the final failure instead of rethrowing it.
- **Logging**: drop a required structured field (e.g. worker id) — only mutate this if a test
  actually asserts on log shape; otherwise it's a non-functional detail (not a valid mutation —
  see Operating constraints in `SKILL.md`).

## API package (`@qe/base-api-js`)

- **Client wrapper**: drop a required header; swap the HTTP method; don't propagate a non-2xx
  status into the typed error; silently retry on a 4xx (client error) instead of failing fast.
- **Schema validation**: skip Zod validation entirely; accept a response missing a required
  field; coerce a type instead of rejecting a mismatch.
- **Mock server (self-test only)**: return a mismatched status code for a given route; omit a
  required response field.

## Web package (`@qe/base-web-js`)

- **Browser/context factory**: reuse a context across tests that should be isolated; drop a
  required launch option (e.g. viewport size); swap headless/headed in a context that a test
  asserts is headless.
- **BasePage**: use a locator that matches more than the intended element (e.g. drop a `level`
  scope on a heading role); replace an explicit wait with a fixed timeout; swallow an element
  state exception instead of propagating it.
- **Wait helpers**: shorten a timeout below what a slow-but-valid flow needs; return success
  without actually polling.

## Web BDD package (`@qe/base-web-cucumber-js`)

- **Step-def glue**: drop a required `World` state reset between scenarios; swap a step's
  expected table-row mapping.
- **Hooks**: skip a `Before`/`After` hook's cleanup; run a hook in the wrong order relative to the
  fixture it depends on.

## Choosing a target

Prefer, in order:

1. A target with an existing `@p0`/`@p1` test that already asserts on the exact value/behavior a
   mutation would break (strongest signal, no new test needed).
2. A target one existing test partially covers — the mutation's `expected_assertion` row should
   state precisely why the existing assertion is still strong enough.
3. A target with no test strong enough to catch it: don't mutate it yet. Report it in `REPORT`/
   `IMPROVE` mode as a coverage gap, and propose strengthening the existing test (never a new
   mutation-only test) before scheduling that mutation.
