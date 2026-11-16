// Accessibility sweep (L2-041): axe-core on every screen and state, dark and light, plus
// reduced motion and touch targets. Runs only when a person asks: `npm run e2e:sweeps`.
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../fixtures/wz-test';
import { RidePage } from '../pages/ride.page';
import { SetupPage } from '../pages/setup.page';
import { freeRide, state, workout } from '../fixtures/states';

/** Waits for entrance animations (dialog fade-in, toasts) so contrast is measured at rest. */
const settled = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );

const serious = async (page: import('@playwright/test').Page) =>
  (await settled(page),
  await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()).violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);

for (const theme of ['dark', 'light'] as const) {
  test.describe(`axe, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => {
        document.addEventListener('DOMContentLoaded', () =>
          document.documentElement.setAttribute('data-theme', t),
        );
      }, theme);
    });

    const rides = {
      default: state(),
      empty: freeRide(),
      paused: state({ workout: workout({ status: 'paused' }) }),
      manual: state({ target_resistance: 22, workout: workout({ mode: 'manual' }) }),
      disconnected: state({
        ble: 'disconnected',
        workout: workout({ status: 'paused: bike disconnected' }),
      }),
      scanning: state({ ble: 'scanning' }),
      'bluetooth off': state({ ble: 'error', adapter: 'off' }),
    };
    for (const [name, s] of Object.entries(rides)) {
      test(`ride dashboard, ${name}`, async ({ page, api, events }) => {
        const ride = new RidePage(page, api, events);
        await ride.open(s);
        await expect(ride.statusLine).toBeVisible();
        expect(await serious(page)).toEqual([]);
      });
    }

    test('setup, default and invalid', async ({ page, api, events }) => {
      const setup = new SetupPage(page, api, events);
      await setup.open();
      expect(await serious(page)).toEqual([]);
      await setup.field('Rounds').fill('0');
      await expect(setup.formSummary).toBeVisible();
      expect(await serious(page)).toEqual([]);
    });

    test('unlock and not found', async ({ page }) => {
      await page.goto('/unlock');
      expect(await serious(page)).toEqual([]);
      await page.goto('/nowhere');
      expect(await serious(page)).toEqual([]);
    });

    test('diagnostics dialog', async ({ page, api, events }) => {
      api.on('GET', '/api/diagnostics/packets', { json: { lines: ['1 f0 d1'] } });
      const ride = new RidePage(page, api, events);
      await ride.open(state());
      await ride.diagnosticsButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      expect(await serious(page)).toEqual([]);
    });
  });
}

test('reduced motion stops the pulse scale and the banner animation', async ({
  page,
  api,
  events,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const ride = new RidePage(page, api, events);
  await ride.open(state({ workout: workout({ remaining: 3 }) }));
  await expect(ride.timeLeft).toHaveClass(/is-pulse/);
  expect(await ride.timeLeft.evaluate((e) => getComputedStyle(e).scale)).toMatch(/^(1|none)$/);
  await ride.push(state({ workout: workout({ segment: 10, remaining: 20 }) }));
  expect(await ride.phaseBanner.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
});

test('every control is at least 44 × 44 px', async ({ page, api, events }) => {
  const ride = new RidePage(page, api, events);
  await ride.open(state({ workout: workout({ mode: 'manual' }) }));
  const small = await page.evaluate(() =>
    [
      ...document.querySelectorAll<HTMLElement>(
        'button, a[href], input, [role="switch"], [role="slider"]',
      ),
    ]
      .filter((e) => !e.classList.contains('skip-link'))
      .map((e) => ({ e, r: e.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.width < 44 || r.height < 44))
      .map(({ e, r }) => `${e.outerHTML.slice(0, 60)} ${r.width}×${r.height}`),
  );
  expect(small).toEqual([]);
});
