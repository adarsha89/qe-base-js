import { logger } from '@qe/base-js';
import { test as teardown, expect } from '../fixtures';
import { formatSharedBrowserSummary, stopSharedBrowserServer } from '../shared-browser/lifecycle';
import { engineFromTeardownName } from '../shared-browser/projects';
import { listAttachedWorkers, readSharedBrowserState } from '../shared-browser/state';

/**
 * `teardown_<engine>` projects (paired with `setup_<engine>` through its `teardown`
 * property): each runs this one test, which stops the engine's shared browser once every
 * UI project on that engine has finished, and logs one summary line.
 *
 * Ported verbatim from `playwright-test-automation`'s
 * `tests/setup/shared-browser.teardown.ts`.
 *
 * Playwright skips teardown projects on Ctrl+C, SIGTERM, SIGKILL and
 * `--global-timeout`; the server's runner watchdog stops the browser then.
 */

teardown(
  'stops the shared browser after every UI project on this engine',
  { tag: ['@p3', '@framework', '@teardown-shared-browser'] },
  async ({}, testInfo) => {
    const engine = engineFromTeardownName(testInfo.project.name);
    logger.info('Entered browser teardown for ' + engine);
    const stop = await stopSharedBrowserServer(engine);
    logger.info(formatSharedBrowserSummary(engine, stop));

    expect(['stopped', 'not-running']).toContain(stop.result);
    expect(readSharedBrowserState(engine)).toBeUndefined();
    expect(listAttachedWorkers(engine)).toEqual([]);
  },
);
