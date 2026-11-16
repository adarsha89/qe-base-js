import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { createEnv } from '../config/createEnv';

const ORIGINAL_ENV = { ...process.env };

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test(
  'resolves successfully when every required var is present and valid',
  { tag: ['@unit', '@create-env-resolves-valid'] },
  () => {
    process.env.EXAMPLE_BASE_URL = 'https://example.com';
    const env = createEnv(z.object({ EXAMPLE_BASE_URL: z.string().url() }));
    expect(env.EXAMPLE_BASE_URL).toBe('https://example.com');
  },
);

test(
  'throws immediately, listing every issue, when a required var is missing',
  { tag: ['@unit', '@create-env-throws-on-missing'] },
  () => {
    delete process.env.EXAMPLE_BASE_URL;
    expect(() => createEnv(z.object({ EXAMPLE_BASE_URL: z.string().url() }))).toThrow(/EXAMPLE_BASE_URL/);
  },
);

test(
  'throws when a present var fails its schema validation',
  { tag: ['@unit', '@create-env-throws-on-malformed'] },
  () => {
    process.env.EXAMPLE_BASE_URL = 'not-a-url';
    expect(() => createEnv(z.object({ EXAMPLE_BASE_URL: z.string().url() }))).toThrow(/EXAMPLE_BASE_URL/);
  },
);

test('resolves a declared default when the var is absent', { tag: ['@unit', '@create-env-resolves-default'] }, () => {
  delete process.env.FEATURE_FLAG;
  const env = createEnv(z.object({ FEATURE_FLAG: z.enum(['true', 'false']).default('false') }));
  expect(env.FEATURE_FLAG).toBe('false');
});
