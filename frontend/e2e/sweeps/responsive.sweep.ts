// Responsive sweep (L2-040). Runs only when a person asks: `npm run e2e:sweeps`.
import { expect, test } from '../fixtures/wz-test';
import { RidePage } from '../pages/ride.page';
import { SetupPage } from '../pages/setup.page';
import { state } from '../fixtures/states';

const box = async (l: import('@playwright/test').Locator) => {
  const b = await l.boundingBox();
  if (!b) throw new Error('not visible');
  return b;
};

test('320 px: one column, the panel below, no horizontal scroll', async ({ page, api, events }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const ride = new RidePage(page, api, events);
  await ride.open(state());
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  expect((await box(ride.aside)).y).toBeGreaterThan((await box(ride.main)).y);
});

test('40–48 rem: readouts two across', async ({ page, api, events }) => {
  await page.setViewportSize({ width: 700, height: 900 });
  const ride = new RidePage(page, api, events);
  await ride.open(state());
  // Two across: cadence sits to the right of power, bottom-aligned with it as in the mocks.
  const power = await box(ride.power);
  const cadence = await box(page.locator('.readout--cadence'));
  expect(cadence.x).toBeGreaterThanOrEqual(power.x + power.width);
  expect(Math.abs(cadence.y + cadence.height - (power.y + power.height))).toBeLessThan(8);
});

test('48–64 rem: the five metrics in one row', async ({ page, api, events }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  const ride = new RidePage(page, api, events);
  await ride.open(state());
  const ys = await ride.metrics
    .locator('dt')
    .evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)));
  expect(new Set(ys).size).toBe(1);
});

test('64 rem: the 340 px panel and the 420 px preview sit beside the content', async ({
  page,
  api,
  events,
}) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  const ride = new RidePage(page, api, events);
  await ride.open(state());
  expect(Math.round((await box(ride.aside)).width)).toBe(340);
  const setup = new SetupPage(page, api, events);
  await setup.open();
  expect(Math.round((await box(setup.preview)).width)).toBe(420);
});

test('rotating re-sizes the trace canvas without a reload', async ({ page, api, events }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  const ride = new RidePage(page, api, events);
  await ride.open(state());
  const before = await ride.traceCanvas.evaluate((c: HTMLCanvasElement) => c.width);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() => ride.traceCanvas.evaluate((c: HTMLCanvasElement) => c.width))
    .not.toBe(before);
});
