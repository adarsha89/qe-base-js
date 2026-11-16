import { test, expect } from '@playwright/test';
import { buildDefaultHeaders, buildPath, buildQuery } from '../client/requestBuilder';

test.describe('buildDefaultHeaders', () => {
  test('always sets Content-Type to application/json', { tag: ['@unit', '@build-headers-content-type'] }, () => {
    expect(buildDefaultHeaders()).toEqual({ 'Content-Type': 'application/json' });
  });

  test(
    'adds a Bearer Authorization header when a token is given',
    { tag: ['@unit', '@build-headers-with-token'] },
    () => {
      expect(buildDefaultHeaders('abc123')).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer abc123',
      });
    },
  );
});

test.describe('buildPath', () => {
  test('interpolates a single :param segment', { tag: ['@unit', '@build-path-single-param'] }, () => {
    expect(buildPath('/users/:id', { id: 42 })).toBe('/users/42');
  });

  test(
    'interpolates multiple :param segments and encodes values',
    { tag: ['@unit', '@build-path-multi-param-encoded'] },
    () => {
      expect(buildPath('/orgs/:org/users/:name', { org: 'qe team', name: 'a/b' })).toBe('/orgs/qe%20team/users/a%2Fb');
    },
  );

  test('returns the path unchanged when no pathParams are given', { tag: ['@unit', '@build-path-no-params'] }, () => {
    expect(buildPath('/users')).toBe('/users');
  });
});

test.describe('buildQuery', () => {
  test('returns an empty string when no query params are given', { tag: ['@unit', '@build-query-empty'] }, () => {
    expect(buildQuery()).toBe('');
    expect(buildQuery({})).toBe('');
  });

  test(
    'builds a query string and skips undefined/null values',
    { tag: ['@unit', '@build-query-skips-nullish'] },
    () => {
      expect(buildQuery({ page: 1, active: true, name: undefined })).toBe('?page=1&active=true');
    },
  );
});
