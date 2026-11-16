import { faker } from '@faker-js/faker';
import { STATE_MARKER_PREFIX } from './sharedBrowserTestData';

/**
 * Random, per-call marker used as a cookie / storage key by the
 * shared-browser isolation tests. Ported verbatim from
 * `playwright-test-automation`'s `data/builders/state-marker.builder.ts`.
 * Being unique per call, a leaked value can never be confused with a stale
 * one from an earlier run.
 */
export function buildStateMarker(): string {
  return `${STATE_MARKER_PREFIX}${faker.string.alphanumeric(10)}`;
}
