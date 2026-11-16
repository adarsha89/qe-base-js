import { defineConfig } from '@playwright/test';
import { sharedBrowserProjects } from './src/shared-browser/projects';

/**
 * Self-tests for this package's own fixtures/BasePage/shared-browser model —
 * never a live external site (framework-guidelines.md §1, §6). All three
 * engines are wired through `sharedBrowserProjects()` because the shared-
 * browser model is explicitly multi-engine; pipeline verification commands
 * still pass `--project=chromium` per
 * `.ai/context/self-test-verification-workflow.md`.
 */
export default defineConfig({
  testDir: './src',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['junit', { outputFile: 'reports/junit-results.xml' }]] : 'list',
  projects: sharedBrowserProjects([
    { name: 'chromium', testMatch: '__tests__/**/*.spec.ts', use: { browserName: 'chromium' } },
    { name: 'firefox', testMatch: '__tests__/**/*.spec.ts', use: { browserName: 'firefox' } },
    { name: 'webkit', testMatch: '__tests__/**/*.spec.ts', use: { browserName: 'webkit' } },
  ]),
});
