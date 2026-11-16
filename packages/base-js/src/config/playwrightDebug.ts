/**
 * Ported verbatim from `playwright-test-automation`'s `config/env.ts`.
 *
 * True under `--debug` / `PWDEBUG` (mirrors playwright-core's `debugMode()`:
 * any value except `'0'` / `'false'` enables it). A shared-browser fixture
 * (see `@qe/base-web-js`) uses this to fall back to a per-worker browser so
 * the Inspector works.
 */
export function isPlaywrightDebugMode(): boolean {
  const value = process.env.PWDEBUG;
  return value !== undefined && value !== '' && value !== '0' && value !== 'false';
}
