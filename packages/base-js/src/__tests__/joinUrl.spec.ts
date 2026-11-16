import { test, expect } from '@playwright/test';
import { joinUrl } from '../url/joinUrl';

test(
  'joins a base URL with no trailing slash and a path with no leading slash',
  { tag: ['@unit', '@join-url-base-no-slash-path-no-slash'] },
  () => {
    expect(joinUrl('https://example.com', 'inventory.html')).toBe('https://example.com/inventory.html');
  },
);

test(
  'normalizes a trailing slash on the base before joining',
  { tag: ['@unit', '@join-url-base-trailing-slash'] },
  () => {
    expect(joinUrl('https://example.com/', 'inventory.html')).toBe('https://example.com/inventory.html');
  },
);

test(
  'normalizes a leading slash on the path before joining',
  { tag: ['@unit', '@join-url-path-leading-slash'] },
  () => {
    expect(joinUrl('https://example.com', '/inventory.html')).toBe('https://example.com/inventory.html');
  },
);

test(
  'returns the base normalized to a single trailing slash when no path is given',
  { tag: ['@unit', '@join-url-no-path'] },
  () => {
    expect(joinUrl('https://example.com')).toBe('https://example.com/');
  },
);

test(
  'collapses multiple slashes at the join point to exactly one',
  { tag: ['@unit', '@join-url-collapses-multiple-slashes'] },
  () => {
    expect(joinUrl('https://example.com//', '//inventory.html')).toBe('https://example.com/inventory.html');
  },
);
