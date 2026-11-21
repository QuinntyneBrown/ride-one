import { test as base, expect } from '@playwright/test';

/**
 * The shared fixture every spec imports. It fails the spec on any page error and on any request off localhost
 * (AGENTS.md, E2E). Later slices add the fake navigator.bluetooth and the API and hub answers here.
 */
export const test = base.extend<{ guard: void }>({
  guard: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
      await page.route(
        (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
        async (route) => {
          problems.push(`request off localhost: ${route.request().url()}`);
          await route.abort();
        },
      );
      await use();
      expect(problems, 'unexpected page errors or requests').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
