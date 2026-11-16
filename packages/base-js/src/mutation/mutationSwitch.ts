/**
 * The mutation-testing switch every `@qe/base-*-js` package's mutation hooks
 * gate on (see `.ai/skills/mutation-testing/references/hook-design.md`).
 *
 * Deliberately dependency-free (no `zod`/`dotenv`) so it can be imported
 * from the deepest, most performance-sensitive hook without pulling in a
 * config module. Generalizes the `env.MUTATION_ENABLED` flag from
 * `playwright-test-automation`'s `config/env.ts` (there, one Zod-validated
 * boolean) plus `utils/mutation-testing.ts`'s `applyUiMutation` gate into a
 * reusable, package-agnostic primitive with a second axis
 * (`MUTATION_ID`) for selecting exactly one mutation per run.
 */

/** `true` only when `MUTATION_ENABLED` is exactly `"true"` (case-insensitive). Unset/blank/anything else is disabled. */
export function mutationEnabled(): boolean {
  return (process.env.MUTATION_ENABLED ?? '').toLowerCase() === 'true';
}

/** The selected mutation for this run, or `undefined` when mutation mode is disabled. */
export function mutationId(): string | undefined {
  return mutationEnabled() ? process.env.MUTATION_ID : undefined;
}

/** `true` only when mutation mode is enabled and `MUTATION_ID` equals `id` exactly. */
export function isMutationActive(id: string): boolean {
  return mutationId() === id;
}
