import { test, expect } from '../fixtures';
import { BasePage } from '../page/BasePage';

const ORIGIN = 'https://base-page.invalid/';

test(
  'goto navigates to the given URL and waitForLoad/title reflect the loaded page',
  { tag: ['@integration', '@base-page-goto-navigates'] },
  async ({ context, page }) => {
    await context.route(ORIGIN, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Stub Page</title>' }),
    );
    const basePage = new BasePage(page);
    await basePage.goto(ORIGIN);
    await basePage.waitForLoad();
    expect(await basePage.title()).toBe('Stub Page');
  },
);

test.describe('goto default path', () => {
  // page.goto('/') resolves a relative URL against the test's baseURL option, not against
  // whatever the page last navigated to, so the default param needs one configured here.
  test.use({ baseURL: ORIGIN });

  test(
    'goto defaults to "/" when no path is given',
    { tag: ['@integration', '@base-page-goto-defaults-to-root'] },
    async ({ context, page }) => {
      let requestedPath: string | undefined;
      await context.route('**/*', (route) => {
        requestedPath = new URL(route.request().url()).pathname;
        return route.fulfill({ status: 200, contentType: 'text/html', body: '<title>Root</title>' });
      });
      const basePage = new BasePage(page);
      await basePage.goto();
      expect(requestedPath).toBe('/');
    },
  );
});
