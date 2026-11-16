/**
 * Thin console/log wrapper shared by every @qe/base-*-js package.
 *
 * Ported verbatim from `playwright-test-automation`'s `utils/logger.ts`.
 * Centralized so log formatting/behavior (timestamps, log level filtering,
 * shipping to a CI-friendly sink, etc.) can change in one place later
 * without touching every call site across every package.
 */
export const logger = {
  info(message: string, ...meta: unknown[]): void {
    console.log(`[INFO] ${message}`, ...meta);
  },
  warn(message: string, ...meta: unknown[]): void {
    console.warn(`[WARN] ${message}`, ...meta);
  },
  error(message: string, ...meta: unknown[]): void {
    console.error(`[ERROR] ${message}`, ...meta);
  },
  debug(message: string, ...meta: unknown[]): void {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...meta);
    }
  },
};
