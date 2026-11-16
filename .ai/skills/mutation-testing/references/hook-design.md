# Hook Design

How to wire a mutation into existing framework code without touching the package's public
`src/index.ts` surface or weakening a test's assertions.

## The switch

A single module, e.g. `src/__mutation__/mutationSwitch.ts`, exported only within the package
(never re-exported from `src/index.ts`):

```ts
export function mutationEnabled(): boolean {
  return (process.env.MUTATION_ENABLED ?? '').toLowerCase() === 'true';
}

export function mutationId(): string | undefined {
  return mutationEnabled() ? process.env.MUTATION_ID : undefined;
}
```

- `MUTATION_ENABLED` unset, empty, or anything other than `true` (case-insensitive) → disabled.
  Every call site behaves exactly as it does today.
- `MUTATION_ID` selects exactly one mutation from the map for this run. Never apply more than one
  mutation per execution — isolation is what makes a result attributable.

## Where a hook goes

Prefer, in this order:

1. **An existing extension point the test already passes through** — a fixture's setup/teardown,
   the browser/context-factory module, the API client wrapper's request/response path, a config
   module's resolver, the retry helper. If the mutation can live here, it needs zero test-body
   changes.
2. **A declarative binding on the existing test** — when no shared hook naturally covers the
   target behavior, add one line passing a mutation ID into a fixture option the test already
   uses (e.g. `test('...', { tag: [...] }, async ({ page, mutation }) => { ... })` where
   `mutation` is a worker/test fixture that reads `mutationId()` and applies it). The test's own
   assertions and data stay untouched.

Never:

- Add a new test method/file that duplicates an existing one's setup just to host a mutation.
- Branch on `mutationId()` inside a test's assertion itself (that would be asserting on the
  mutation ID, not on real behavior).
- Leave a hook unguarded — every mutation branch is `if (mutationEnabled() && mutationId() === 'X')`
  or equivalent, never a bare conditional that could leak into a normal run.

## Isolation and cleanup

- One mutation per process/worker execution. Don't fan out multiple mutation IDs in one test run
  (`--grep` to select one test, `MUTATION_ID` to select one mutation, run, collect, repeat).
- Cleanup (closing a browser context, resetting a mock server, releasing a retry counter) must
  run identically whether the test passed, failed, or timed out — mirror whatever teardown the
  unmutated path already guarantees. A mutation must never leak state into the next test.
- Parallelize mutation runs only when each worker's mutation state is genuinely isolated (e.g.
  per-worker env var injection in CI matrix jobs) — never share `MUTATION_ID` across workers.

## The map file

`src/__mutation__/mutation-test-map.csv`, one per package that opts in:

```csv
mutation_id,test_file,test_title,target_module,target_symbol,defect_description,expected_assertion
retry-off-by-one,retry.spec.ts,"retries a transient failure exactly twice",src/retry/RetryHelper.ts,shouldRetry,"off-by-one: allows one extra retry","expect(attempts).toBe(2) must fail when attempts resolves to 3"
```

Every `@p0`/`@p1`/`@p2`-tagged test should have at least one row. Keep `defect_description` and
`expected_assertion` specific enough that a reviewer can tell, without running anything, whether
the existing assertion would actually catch the described defect.
