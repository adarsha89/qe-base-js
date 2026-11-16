import { defineConfig } from '@playwright/test';

/**
 * Self-tests only — this package has no browser/UI of its own. `@playwright/test`
 * is used purely as the test runner (shared across every @qe/base-*-js package),
 * matching framework-guidelines.md §1: one runner for both web and non-web self-tests.
 */
export default defineConfig({
  testDir: './src/__tests__',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['junit', { outputFile: 'reports/junit-results.xml' }]] : 'list',
});
