import type { Page, Response } from '@playwright/test';

/**
 * Race-free network-response interceptor, generalized from
 * `playwright-test-automation`'s `utils/network.ts`. That file's
 * `assertBacktraceEventsBeaconPair` hardcoded two Backtrace.io URL patterns
 * and one expected response body — specific to the app it tested, not
 * portable. The underlying *technique* was fully AUT-agnostic and genuinely
 * valuable, so it's extracted here as a reusable primitive: register every
 * `waitForResponse` listener and the triggering action in one `Promise.all`,
 * so a fast response can never arrive before its listener is registered.
 *
 * @example
 * ```ts
 * const [loginResponse] = await waitForResponses(page, [(r) => r.url().endsWith('/api/login')], () =>
 *   page.getByRole('button', { name: 'Log in' }).click(),
 * );
 * ```
 */
export async function waitForResponses(
  page: Page,
  matchers: ReadonlyArray<(response: Response) => boolean>,
  trigger: () => Promise<void>,
  options: { timeoutMs?: number } = {},
): Promise<Response[]> {
  const timeout = options.timeoutMs ?? 10_000;
  const results = await Promise.all([
    ...matchers.map((matches) => page.waitForResponse(matches, { timeout })),
    trigger(),
  ]);
  // The last element is trigger()'s own resolved value (typically void), not a Response.
  return results.slice(0, matchers.length) as Response[];
}
