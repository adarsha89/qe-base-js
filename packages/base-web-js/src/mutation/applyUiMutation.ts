import type { Locator } from '@playwright/test';
import { mutationEnabled } from '@qe/base-js';

/**
 * Applies a deterministic UI defect only during an explicitly enabled
 * mutation run. Ported from `playwright-test-automation`'s
 * `utils/mutation-testing.ts`, with the gate switched from that repo's
 * single, schema-bound `env.MUTATION_ENABLED` to `@qe/base-js`'s
 * dependency-free `mutationEnabled()` (see
 * `.ai/skills/mutation-testing/references/hook-design.md`), so this hook
 * never needs a Zod-validated config module just to check the flag. The
 * mutation behavior itself — exactly one locator, hide or replace its text —
 * is unchanged.
 */
export async function applyUiMutation(target: Locator, mutation: 'hide' | 'replace-text'): Promise<void> {
  if (!mutationEnabled()) {
    return;
  }

  const count = await target.count();
  if (count !== 1) {
    throw new Error(`Cannot apply UI mutation: expected one target, found ${count}.`);
  }

  if (mutation === 'hide') {
    await target.evaluate((element) => element.style.setProperty('display', 'none', 'important'));
  } else {
    await target.evaluate((element) => {
      element.textContent = 'Mutated content';
    });
  }
}
