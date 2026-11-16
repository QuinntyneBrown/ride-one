import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { SetupPage } from './pages/setup.page';
import { state } from './fixtures/states';

test.describe('Theme (L2-061)', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
  });

  test('is dark by default even when the device prefers light', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.root).toHaveAttribute('data-theme', 'dark');
    await expect(ride.root).toHaveCSS('color-scheme', 'dark');
    await expect(ride.themeButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('the toggle switches to light and back without a reload', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await ride.themeButton.click();
    await expect(ride.root).toHaveAttribute('data-theme', 'light');
    await expect(ride.root).toHaveCSS('color-scheme', 'light');
    await expect(ride.themeButton).toHaveAttribute('aria-pressed', 'true');
    await ride.themeButton.click();
    await expect(ride.root).toHaveAttribute('data-theme', 'dark');
    await expect(ride.themeButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('keeps the chosen theme after a reload and on other screens', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await ride.themeButton.click();
    await expect(ride.root).toHaveAttribute('data-theme', 'light');
    await ride.open(state());
    await expect(ride.root).toHaveAttribute('data-theme', 'light');
    await expect(ride.themeButton).toHaveAttribute('aria-pressed', 'true');
    const setup = new SetupPage(page, api, events);
    await setup.open();
    await expect(ride.root).toHaveAttribute('data-theme', 'light');
  });

  test('redraws the power trace in the new colours', async ({ page, api, events }) => {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        type: string,
        ...rest: unknown[]
      ) {
        if (type === 'webgl2') return null;
        return (original as (...a: unknown[]) => unknown).call(this, type, ...rest);
      } as typeof original;
    });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.traceCanvas).toBeVisible();
    // The painted canvas as a data URL, or '' until something has been drawn.
    const pixels = (): Promise<string> =>
      ride.traceCanvas.evaluate((c: HTMLCanvasElement) => {
        const data = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data ?? [];
        return data.some((v, i) => i % 4 === 3 && v > 0) ? c.toDataURL() : '';
      });
    await expect.poll(pixels).not.toBe('');
    const dark = await pixels();
    await ride.themeButton.click();
    await expect.poll(pixels).not.toBe(dark);
  });
});
