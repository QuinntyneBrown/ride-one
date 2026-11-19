// Acceptance Test
// Traces to: L2-097
// Description: The browser edition carries its Content-Security-Policy as a <meta> element. It
// allows its own origin and the 3 YouTube exceptions only. Every browser-edition spec fails on a
// console error, so a violation of the policy anywhere fails the suite.
import { expect, test } from './fixtures/browser-test';
import { NotFoundPage } from '../pages/not-found.page';
import { BrowserRidePage } from './pages/browser-ride.page';

test('every page carries the same-origin policy with the YouTube exceptions (L2-097 AC2)', async ({
  page,
}) => {
  const ride = new BrowserRidePage(page);
  await ride.open();
  const policy = await ride.contentSecurityPolicy();
  const directives = Object.fromEntries(
    policy
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((d) => d[0])
      .map(([name, ...values]) => [name, values]),
  );
  expect(directives).toMatchObject({
    'default-src': ["'self'"],
    'script-src': ["'self'", 'https://www.youtube.com'],
    'connect-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'https://i.ytimg.com'],
    'frame-src': ['https://www.youtube-nocookie.com'],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
  });
  // A static host cannot mint a nonce per response, so Angular's own <style> elements need
  // 'unsafe-inline' (ADR 0018); styles still load from no other origin.
  expect(directives['style-src']).toEqual(["'self'", "'unsafe-inline'"]);
});

test('offers no unlock page: /unlock is not found (L2-097 AC1)', async ({ page }) => {
  await page.goto('/unlock');
  const notFound = new NotFoundPage(page);
  await expect(notFound.code).toBeVisible();
  await expect(page).toHaveTitle('Page not found · Wattzup');
});
