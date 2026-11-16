import type { Page } from '@playwright/test';

/**
 * Shared page object base, ported verbatim from `playwright-test-automation`'s
 * `pages/base.page.ts`. Every page object extends this for common
 * navigation/wait behavior instead of duplicating it per page.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async title(): Promise<string> {
    return this.page.title();
  }
}
