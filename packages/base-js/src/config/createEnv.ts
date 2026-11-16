import 'dotenv/config';
import type { ZodObject, ZodRawShape, infer as ZodInfer } from 'zod';

/**
 * Generalized from `playwright-test-automation`'s `config/env.ts`.
 *
 * That file hardcoded one `envSchema` for one application's env vars
 * (`BASE_URL`, `SAUCEDEMO_BASE_URL`, …) — not portable as-is, since every
 * `@qe/base-*-js` package needs its own schema (an API package's base URL
 * differs from a web package's). `createEnv` keeps the *pattern* — parse
 * once at call time via Zod, throw immediately with every issue listed
 * instead of failing deep inside a self-test — as a factory each package's
 * own config module calls with its own schema (framework-guidelines.md
 * principle c: nothing else should read `process.env` directly).
 *
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { createEnv } from '@qe/base-js';
 *
 * const schema = z.object({ API_BASE_URL: z.string().url() });
 * export const env = createEnv(schema);
 * ```
 */
export function createEnv<Shape extends ZodRawShape>(schema: ZodObject<Shape>): ZodInfer<ZodObject<Shape>> {
  const parsed = schema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');
    throw new Error(`Invalid or missing environment variables. Check your .env file against .env.example:\n${issues}`);
  }

  return parsed.data;
}
