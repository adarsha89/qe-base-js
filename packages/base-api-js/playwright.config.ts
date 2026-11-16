import { defineConfig } from '@playwright/test';

/** Self-tests only, run against a local mock server this package starts itself — no live external target. */
export default defineConfig({
  testDir: './src/__tests__',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['junit', { outputFile: 'reports/junit-results.xml' }]] : 'list',
});
