// Acceptance test
// Traces to: L2-032 AC1, AC4; L2-144 AC1, AC2
// Description: the app header offers Full screen, which enters full screen and then reads "Exit full screen" and
// leaves it; where the browser has no Fullscreen API the button is absent. Each page of the shell marks its own item
// current. On a phone the navigation takes its own full-width row of equal items. The header has no streak, level or XP
// (ADR 0039).
import { echelonBike } from './fixtures/echelon';
import { withoutFullscreen } from './fixtures/fullscreen';
import { library } from './fixtures/library';
import { expect, test } from './fixtures/test';
import { ClassLibraryPage } from './pages/class-library.page';
import { HomePage } from './pages/home.page';
import { ProfilePage } from './pages/profile.page';

test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

test('Full screen enters full screen, and Exit full screen leaves it (L2-144 AC1) @critical', async ({
  page,
}) => {
  const home = new HomePage(page);
  await home.open();

  await home.header.fullScreen.click();
  await expect.poll(() => home.header.inFullScreen()).toBe(true);
  await expect(home.header.exitFullScreen).toBeVisible();
  await expect(home.header.fullScreen).toHaveCount(0);

  await home.header.exitFullScreen.click();
  await expect.poll(() => home.header.inFullScreen()).toBe(false);
  await expect(home.header.fullScreen).toBeVisible();
});

test('where the browser has no Fullscreen API, the button is absent (L2-144 AC2)', async ({
  page,
}) => {
  await withoutFullscreen(page);
  const home = new HomePage(page);
  await home.open();

  await expect(home.header.bike).toBeVisible();
  await expect(home.header.fullScreen).toHaveCount(0);
});

test('each page of the shell marks its own item current, and offers Full screen (L2-032 AC1)', async ({
  page,
  api,
}) => {
  api.answer('GET', '/api/classes', library);
  for (const [screen, item] of [
    [new ClassLibraryPage(page), 'Classes'],
    [new ProfilePage(page), 'Profile'],
  ] as const) {
    await screen.open();
    await expect(screen.header.current()).toHaveText(item);
    await expect(screen.header.fullScreen).toBeVisible();
  }
});

test('on a phone the navigation takes its own row of equal items (L2-032 AC4)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const home = new HomePage(page);
  await home.open();

  await expect(home.header.links).toHaveCount(3);
  await expect(home.header.bike).toBeHidden();
  const brand = await home.header.brand.boundingBox();
  const items = await Promise.all(
    (await home.header.links.all()).map((link) => link.boundingBox()),
  );
  expect(items).toHaveLength(3);
  for (const item of items) {
    expect(item!.y).toBeGreaterThanOrEqual(brand!.y + brand!.height);
    expect(Math.abs(item!.width - items[0]!.width)).toBeLessThan(1);
  }
  expect(items[2]!.x + items[2]!.width - items[0]!.x).toBeGreaterThan(390 - 2 * 24);
});
