import { expect, test } from './fixtures/wz-test';
import { NotFoundPage } from './pages/not-found.page';

test.describe('Not-found page (L2-056)', () => {
  test('names the unknown path as text', async ({ page }) => {
    await page.goto('/workouts/history');
    const notFound = new NotFoundPage(page);
    await expect(notFound.code).toHaveText('404');
    await expect(notFound.heading).toHaveText("This page isn't part of your ride");
    await expect(notFound.text).toHaveText(
      "The address /workouts/history doesn't exist in Wattzup. Your ride and the bike connection are unaffected.",
    );
    await expect(page).toHaveTitle('Page not found · Wattzup');
  });

  test('renders markup in the path as text', async ({ page }) => {
    await page.goto('/%3Cb%3Ex%3C%2Fb%3E');
    const notFound = new NotFoundPage(page);
    await expect(notFound.text).toContainText('<b>x</b>');
    await expect(page.locator('.auth-card b')).toHaveCount(0);
  });

  test('links back to the dashboard and to setup', async ({ page }) => {
    await page.goto('/nowhere');
    const notFound = new NotFoundPage(page);
    await expect(notFound.dashboardLink).toHaveAttribute('href', '/');
    await expect(notFound.setupLink).toHaveAttribute('href', '/setup');
  });
});

test.describe('Page titles (L2-041)', () => {
  test('names each screen', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Ride · Wattzup');
    await page.goto('/setup');
    await expect(page).toHaveTitle('Set up your ride · Wattzup');
  });
});
