import { test, expect } from '../fixtures';
import { applyUiMutation } from '../mutation/applyUiMutation';

test.afterEach(() => {
  delete process.env.MUTATION_ENABLED;
});

test(
  'is a no-op when MUTATION_ENABLED is not set',
  { tag: ['@integration', '@bom', '@apply-ui-mutation-disabled-noop'] },
  async ({ page }) => {
    await page.setContent('<p data-testid="target">Original content</p>');
    const target = page.getByTestId('target');
    await applyUiMutation(target, 'replace-text');
    await expect(target).toHaveText('Original content');
    await expect(target).toBeVisible();
  },
);

test(
  'hides the target element when enabled with mutation "hide"',
  { tag: ['@integration', '@bom', '@apply-ui-mutation-hide'] },
  async ({ page }) => {
    process.env.MUTATION_ENABLED = 'true';
    await page.setContent('<p data-testid="target">Original content</p>');
    const target = page.getByTestId('target');
    await applyUiMutation(target, 'hide');
    await expect(target).toBeHidden();
  },
);

test(
  'replaces the target element\'s text when enabled with mutation "replace-text"',
  { tag: ['@integration', '@bom', '@apply-ui-mutation-replace-text'] },
  async ({ page }) => {
    process.env.MUTATION_ENABLED = 'true';
    await page.setContent('<p data-testid="target">Original content</p>');
    const target = page.getByTestId('target');
    await applyUiMutation(target, 'replace-text');
    await expect(target).toHaveText('Mutated content');
  },
);

test(
  'throws when the locator matches zero elements',
  { tag: ['@integration', '@bom', '@apply-ui-mutation-throws-zero-targets'] },
  async ({ page }) => {
    process.env.MUTATION_ENABLED = 'true';
    await page.setContent('<p data-testid="other">Not the target</p>');
    const target = page.getByTestId('target');
    await expect(applyUiMutation(target, 'hide')).rejects.toThrow('expected one target, found 0');
  },
);

test(
  'throws when the locator matches more than one element',
  { tag: ['@integration', '@bom', '@apply-ui-mutation-throws-multiple-targets'] },
  async ({ page }) => {
    process.env.MUTATION_ENABLED = 'true';
    await page.setContent('<p data-testid="target">First</p><p data-testid="target">Second</p>');
    const target = page.getByTestId('target');
    await expect(applyUiMutation(target, 'hide')).rejects.toThrow('expected one target, found 2');
  },
);
