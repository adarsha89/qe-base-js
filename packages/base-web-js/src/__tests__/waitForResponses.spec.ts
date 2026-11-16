import { test, expect } from '../fixtures';
import { waitForResponses } from '../network/waitForResponses';

const ORIGIN = 'https://wait-for-responses.invalid/';

test(
  "resolves with the responses in matcher order, excluding the trigger's own return value",
  { tag: ['@integration', '@wait-for-responses-order-and-no-trigger-leak'] },
  async ({ context, page }) => {
    await context.route(ORIGIN, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<button id="go">Go</button>' }),
    );
    await context.route(`${ORIGIN}a`, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"id":"a"}' }),
    );
    await context.route(`${ORIGIN}b`, (route) =>
      route.fulfill({ status: 201, contentType: 'application/json', body: '{"id":"b"}' }),
    );
    await page.goto(ORIGIN);

    const [responseA, responseB] = await waitForResponses(
      page,
      [(r) => r.url().endsWith('/a'), (r) => r.url().endsWith('/b')],
      () =>
        page.evaluate((origin: string) => {
          void fetch(`${origin}a`);
          void fetch(`${origin}b`);
        }, ORIGIN),
    );

    expect(responseA.status()).toBe(200);
    expect(responseB.status()).toBe(201);
  },
);

test(
  'rejects when a matched response never arrives within the timeout',
  { tag: ['@integration', '@wait-for-responses-times-out'] },
  async ({ context, page }) => {
    await context.route(ORIGIN, (route) =>
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' }),
    );
    await page.goto(ORIGIN);

    const outcome = waitForResponses(page, [(r) => r.url().endsWith('/never-called')], async () => undefined, {
      timeoutMs: 200,
    });

    await expect(outcome).rejects.toThrow(/Timeout/);
  },
);
