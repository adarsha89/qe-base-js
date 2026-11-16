import { test, expect } from '@playwright/test';
import { mutationEnabled, mutationId, isMutationActive } from '../mutation/mutationSwitch';

test.describe('mutation switch: disabled is a true no-op', () => {
  test(
    'mutationEnabled is false when MUTATION_ENABLED is unset',
    { tag: ['@unit', '@bom', '@mutation-switch-disabled-when-unset'] },
    () => {
      delete process.env.MUTATION_ENABLED;
      expect(mutationEnabled()).toBe(false);
      expect(mutationId()).toBeUndefined();
    },
  );

  test(
    'mutationEnabled is false for any value other than "true" (case-insensitive)',
    { tag: ['@unit', '@bom', '@mutation-switch-disabled-for-non-true'] },
    () => {
      for (const value of ['false', 'TRUE_TYPO', '1', '']) {
        process.env.MUTATION_ENABLED = value;
        expect(mutationEnabled()).toBe(false);
      }
      delete process.env.MUTATION_ENABLED;
    },
  );

  test(
    'mutationId never leaks a MUTATION_ID while disabled',
    { tag: ['@unit', '@bom', '@mutation-switch-id-hidden-while-disabled'] },
    () => {
      delete process.env.MUTATION_ENABLED;
      process.env.MUTATION_ID = 'retry-off-by-one';
      expect(mutationId()).toBeUndefined();
      delete process.env.MUTATION_ID;
    },
  );
});

test.describe('mutation switch: enabled selects exactly one mutation', () => {
  test(
    'mutationEnabled accepts "true" case-insensitively',
    { tag: ['@unit', '@bom', '@mutation-switch-enabled-case-insensitive'] },
    () => {
      for (const value of ['true', 'True', 'TRUE']) {
        process.env.MUTATION_ENABLED = value;
        expect(mutationEnabled()).toBe(true);
      }
      delete process.env.MUTATION_ENABLED;
    },
  );

  test(
    'mutationId returns MUTATION_ID only while enabled',
    { tag: ['@unit', '@bom', '@mutation-switch-id-visible-while-enabled'] },
    () => {
      process.env.MUTATION_ENABLED = 'true';
      process.env.MUTATION_ID = 'retry-off-by-one';
      expect(mutationId()).toBe('retry-off-by-one');
      delete process.env.MUTATION_ENABLED;
      delete process.env.MUTATION_ID;
    },
  );

  test(
    'isMutationActive matches only the exact selected id',
    { tag: ['@unit', '@bom', '@mutation-switch-is-active-exact-match'] },
    () => {
      process.env.MUTATION_ENABLED = 'true';
      process.env.MUTATION_ID = 'retry-off-by-one';
      expect(isMutationActive('retry-off-by-one')).toBe(true);
      expect(isMutationActive('some-other-mutation')).toBe(false);
      delete process.env.MUTATION_ENABLED;
      delete process.env.MUTATION_ID;
    },
  );
});
