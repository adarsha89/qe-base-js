import { z } from 'zod';

/**
 * Shared schema fragment for the `MUTATION_ENABLED` env var, generalized
 * from `playwright-test-automation`'s `config/env.ts`. Spread this into any
 * package's own env schema that needs the flag:
 *
 * @example
 * ```ts
 * const schema = z.object({ ...mutationEnabledFields, API_BASE_URL: z.string().url() });
 * ```
 *
 * Prefer the dependency-free `mutationEnabled()`/`mutationId()` in
 * `../mutation/mutationSwitch` for a package's own `src/` code — this
 * schema fragment exists only for a package's config module to surface the
 * same flag alongside its other typed, validated env vars.
 */
export const mutationEnabledFields = {
  MUTATION_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
};
