import { test as base } from '@playwright/test';
import { isPlaywrightDebugMode, logger, mutationEnabled } from '@qe/base-js';
import {
  readReadySharedBrowser,
  SharedBrowserError,
  SHARED_BROWSER_CONNECT_TIMEOUT_MS,
  toSharedBrowserName,
  waitForSharedBrowserVerdict,
} from './shared-browser/client';
import { registerWorkerAttachment } from './shared-browser/state';
import type { ReadySharedBrowserState } from './shared-browser/types';

/**
 * The generic shared-browser fixture wiring, extracted from
 * `playwright-test-automation`'s `fixtures/index.ts`. That file mixed this
 * AUT-agnostic machinery with app-specific fixtures (`authenticatedPage`
 * with hardcoded login selectors, `exampleClient`, `sauceDemoAuthenticatedPage`)
 * — only the generic part ports here. A downstream consumer extends this
 * `test` (not `@playwright/test`'s own) with its own fixtures via
 * `test.extend<MyFixtures>({ ... })`, the same way the original repo's
 * `fixtures/index.ts` built on top of `@playwright/test`'s `base`.
 *
 * Execution model: each browser engine (chromium, firefox, webkit) runs ONE
 * shared browser per test run/shard, shared by every UI project on it. A
 * `setup_<engine>` project (see `setup/shared-browser.setup.ts`, wired via
 * `sharedBrowserProjects()`) starts it as a detached, loopback-only browser
 * server and `teardown_<engine>` stops it after the last of those projects —
 * there is no global setup. Every worker of those projects connects to it
 * through the overridden `connectOptions` below. Every test still gets a
 * brand-new `BrowserContext` and `Page` from Playwright's built-in
 * `context`/`page` fixtures, closed when the test ends.
 */

/** Playwright's messages when a test's browser went away underneath it. */
const BROWSER_CLOSED_ERROR = /browser has been closed|Browser closed|Target .*closed/i;

/** The attributable message for a shared browser that is no longer usable. */
function sharedBrowserFailureMessage(sharedBrowser: ReadySharedBrowserState, verdict: string): string {
  try {
    readReadySharedBrowser(sharedBrowser.key, sharedBrowser.browserName);
  } catch (error) {
    if (error instanceof SharedBrowserError) {
      return error.message;
    }
  }
  return `Shared ${sharedBrowser.browserName} browser "${sharedBrowser.key}" (server pid ${sharedBrowser.serverPid}) is ${verdict}`;
}

export interface SharedBrowserWorkerFixtures {
  /**
   * This worker's view of its engine's single shared browser, read from the
   * state file written by `setup_<engine>`. `null` only under
   * `--debug`/`PWDEBUG` or `MUTATION_ENABLED=true`, where each worker
   * launches its own browser instead (Inspector compatibility; mutation
   * runs never depend on lifecycle projects).
   */
  sharedBrowser: ReadySharedBrowserState | null;
}

// Playwright's own documented pattern for "no new test-scoped fixtures, only worker-scoped
// ones" (Record<string, never>'s index signature breaks the Fixtures generic's inference for
// overridden built-ins like `context`).
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const test = base.extend<{}, SharedBrowserWorkerFixtures>({
  // Lazy: only instantiated through `connectOptions` -> `browser`, i.e. by tests that use a browser.

  sharedBrowser: [
    async ({ browserName }, use, workerInfo) => {
      if (mutationEnabled() || isPlaywrightDebugMode()) {
        logger.info(
          mutationEnabled()
            ? '[shared-browser] mutation mode detected: using a per-worker browser without lifecycle projects'
            : '[shared-browser] --debug/PWDEBUG detected: using a per-worker browser for Inspector compatibility',
        );
        await use(null);
        return;
      }
      const engine = toSharedBrowserName(browserName);
      const state = readReadySharedBrowser(engine, engine);
      registerWorkerAttachment(engine, workerInfo.workerIndex, process.pid);
      await use(state);
    },
    { scope: 'worker' },
  ],

  // Overrides Playwright's option fixture, so the built-in `browser` fixture connects to the
  // shared browser instead of launching its own. `browser`/`context`/`page` themselves stay built-in.
  connectOptions: [
    async ({ sharedBrowser }, use) => {
      await use(
        sharedBrowser
          ? { wsEndpoint: sharedBrowser.wsEndpoint, timeout: SHARED_BROWSER_CONNECT_TIMEOUT_MS }
          : undefined,
      );
    },
    { scope: 'worker' },
  ],

  // After a test that failed because the browser closed, attribute the failure to the shared
  // browser when it crashed or its server is gone. Ordinary failures skip this entirely.
  context: async ({ context, sharedBrowser, browser }, use, testInfo) => {
    await use(context);
    const browserClosed = testInfo.errors.some((error) => BROWSER_CLOSED_ERROR.test(error.message ?? ''));
    if (!sharedBrowser || testInfo.status === testInfo.expectedStatus || !browserClosed) {
      return;
    }
    let attribution: string | undefined;
    try {
      const verdict = await waitForSharedBrowserVerdict(browser, sharedBrowser.key);
      attribution = verdict === 'ready' ? undefined : sharedBrowserFailureMessage(sharedBrowser, verdict);
    } catch (error) {
      logger.warn('[shared-browser] could not check the shared browser after a failed test', error);
    }
    if (attribution !== undefined) {
      throw new SharedBrowserError(`${attribution} during this test`);
    }
  },
});

export { expect } from '@playwright/test';
export { SharedBrowserError } from './shared-browser/client';
export type { ReadySharedBrowserState } from './shared-browser/types';
