import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { expectSchema, expectErrorShape } from '../assertions/responseAssertions';

test.describe('expectSchema', () => {
  test(
    'returns the parsed value when the body matches the schema',
    { tag: ['@unit', '@expect-schema-valid-body'] },
    () => {
      const schema = z.object({ id: z.number(), name: z.string() });
      const parsed = expectSchema({ id: 1, name: 'Ada' }, schema);
      expect(parsed).toEqual({ id: 1, name: 'Ada' });
    },
  );

  test(
    'fails the test when the body does not match the schema',
    { tag: ['@unit', '@expect-schema-invalid-body'] },
    () => {
      const schema = z.object({ id: z.number() });
      expect(() => expectSchema({ id: 'not-a-number' }, schema)).toThrow();
    },
  );
});

test.describe('expectErrorShape', () => {
  test('accepts a body with an error field', { tag: ['@unit', '@expect-error-shape-error-field'] }, () => {
    expect(() => expectErrorShape({ error: 'Not found' })).not.toThrow();
  });

  test('accepts a body with a message field', { tag: ['@unit', '@expect-error-shape-message-field'] }, () => {
    expect(() => expectErrorShape({ message: 'Not found' })).not.toThrow();
  });

  test('rejects a body with neither field', { tag: ['@unit', '@expect-error-shape-rejects-missing'] }, () => {
    expect(() => expectErrorShape({ foo: 'bar' })).toThrow();
  });
});
