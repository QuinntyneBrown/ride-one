import { expect, test } from './fixtures/wz-test';
import { RidePage } from './pages/ride.page';
import { DiagnosticsDialog } from './pages/diagnostics.dialog';
import { flatWorkout, freeRide, state } from './fixtures/states';

test.describe('Power vs. plan trace (L2-026)', () => {
  test('shows the legend, the y maximum and the time ticks', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.traceLegend).toHaveText(['Actual', 'Work target', 'Recover']);
    await expect(ride.traceMax).toHaveText('500 W');
    await expect(ride.traceTicks).toHaveText([
      '0:00',
      '2:00',
      '4:00',
      '6:00',
      '8:00',
      '10:00',
      '12:00',
    ]);
  });

  test('a flat ride has no Recover in the legend', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state({ workout: flatWorkout() }));
    await expect(ride.traceLegend).toHaveText(['Actual', 'Work target']);
  });

  test('restores the history from GET /api/workout/trace on load', async ({
    page,
    api,
    events,
  }) => {
    api.on('GET', '/api/workout/trace', {
      json: { samples: Array.from({ length: 427 }, (_, i) => [i, 200 + (i % 50)]) },
    });
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await api.waitForCall('GET', '/api/workout/trace');
    await expect(ride.traceCanvas).toBeVisible();
  });

  test('reads No ride yet with no workout', async ({ page, api, events }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(freeRide());
    await expect(ride.traceEmpty).toContainText('No ride yet');
    await expect(ride.traceEmpty).toContainText(
      'Your power, drawn against the plan, appears here once a ride starts.',
    );
    await expect(ride.traceCanvas).toHaveCount(0);
  });
});

test.describe('Trace renderer (L2-028)', () => {
  test('hides the canvas from assistive technology and summarises it in text', async ({
    page,
    api,
    events,
  }) => {
    const ride = new RidePage(page, api, events);
    await ride.open(state());
    await expect(ride.traceCanvas).toHaveAttribute('aria-hidden', 'true');
    await expect(ride.traceSummary).toHaveText(/^Average 208 W against a plan average of \d+ W$/);
  });

  test('falls back to Canvas 2D when WebGL2 is unavailable', async ({ page, api, events }) => {
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
    api.on('GET', '/api/diagnostics/packets', { json: { lines: [] } });
    const ride = new RidePage(page, api, events);
    const diag = new DiagnosticsDialog(page);
    await ride.open(state());
    await expect(ride.traceCanvas).toBeVisible();
    await ride.diagnosticsButton.click();
    await expect(diag.value('Trace renderer')).toHaveText('Canvas 2D');
  });

  test('renders at no more than 2× the CSS size', async ({ browser, api: _api }) => {
    void _api;
    const context = await browser.newContext({ deviceScaleFactor: 3 });
    const page = await context.newPage();
    await page.route('**/api/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path === '/api/status') return route.fulfill({ json: state() });
      if (path === '/api/workout/trace') return route.fulfill({ json: { samples: [] } });
      return route.abort();
    });
    await page.goto('/');
    const canvas = page.locator('figure.trace canvas');
    await expect(canvas).toBeVisible();
    await expect
      .poll(() =>
        canvas.evaluate((c: HTMLCanvasElement) => c.width / c.getBoundingClientRect().width),
      )
      .toBeCloseTo(2, 1);
    await context.close();
  });
});
