// Accessibility sweep (L2-041): axe-core on every screen and state, dark and light, plus
// reduced motion and touch targets. Runs only when a person asks: `npm run e2e:sweeps`.
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '../fixtures/wz-test';
import type { FakeBluetooth } from '../fixtures/fake-bluetooth';
import { DiagnosticsDialog } from '../pages/diagnostics.dialog';
import { RidePage } from '../pages/ride.page';
import { SetupPage } from '../pages/setup.page';

/** Waits for entrance animations (dialog fade-in, toasts) so contrast is measured at rest. */
const settled = (page: Page) =>
  page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => undefined)),
    ),
  );

const serious = async (page: Page) =>
  (await settled(page),
  await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze()).violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);

/** Connects the fake bike and, with `ride`, starts setup's default plan. */
async function connected(page: Page, ride = false): Promise<RidePage> {
  const dashboard = new RidePage(page);
  await dashboard.open();
  await dashboard.connect();
  await expect(dashboard.statusState).toHaveText('Connected');
  if (ride) {
    const setup = new SetupPage(page);
    await setup.open();
    await setup.startButton.click();
    await page.waitForURL(/\/$/);
    await expect(dashboard.pauseButton).toBeVisible();
  }
  return dashboard;
}

for (const theme of ['dark', 'light'] as const) {
  test.describe(`axe, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => {
        document.addEventListener('DOMContentLoaded', () =>
          document.documentElement.setAttribute('data-theme', t),
        );
      }, theme);
    });

    const rides: Record<string, (page: Page, bluetooth: FakeBluetooth) => Promise<void>> = {
      'no bike chosen': async (page) => {
        await new RidePage(page).open();
      },
      'free ride': async (page) => void (await connected(page)),
      running: async (page) => void (await connected(page, true)),
      paused: async (page) => {
        const ride = await connected(page, true);
        await ride.pauseButton.click();
        await expect(ride.resumeButton).toBeVisible();
      },
      'bike lost': async (page, bluetooth) => {
        const ride = await connected(page, true);
        await bluetooth.drop();
        await expect(ride.statusState).toHaveText('Disconnected');
      },
      'bluetooth off': async (page, bluetooth) => {
        await bluetooth.unavailableBeforeLoad();
        const ride = new RidePage(page);
        await ride.open();
        await expect(ride.checkAgainButton).toBeVisible();
      },
    };
    for (const [name, reach] of Object.entries(rides)) {
      test(`ride dashboard, ${name}`, async ({ page, bluetooth }) => {
        await reach(page, bluetooth);
        await expect(new RidePage(page).statusName).toBeVisible();
        expect(await serious(page)).toEqual([]);
      });
    }

    test('setup, default and invalid', async ({ page }) => {
      const setup = new SetupPage(page);
      await setup.goto();
      expect(await serious(page)).toEqual([]);
      await setup.field('Rounds').fill('0');
      await expect(setup.formSummary).toBeVisible();
      expect(await serious(page)).toEqual([]);
    });

    test('not found', async ({ page }) => {
      await page.goto('/nowhere');
      expect(await serious(page)).toEqual([]);
    });

    test('diagnostics dialog', async ({ page }) => {
      await connected(page);
      const diagnostics = new DiagnosticsDialog(page);
      await diagnostics.openButton.click();
      await expect(diagnostics.dialog).toBeVisible();
      expect(await serious(page)).toEqual([]);
    });
  });
}

test('reduced motion stops the pulse scale and the banner animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const ride = await connected(page, true);
  await expect(ride.timeLeft).toHaveClass(/is-pulse/, { timeout: 15_000 });
  expect(await ride.timeLeft.evaluate((e) => getComputedStyle(e).scale)).toMatch(/^(1|none)$/);
  await expect(ride.phaseBanner).toBeVisible({ timeout: 15_000 });
  expect(await ride.phaseBanner.evaluate((e) => getComputedStyle(e).animationName)).toBe('none');
});

test('every control is at least 44 × 44 px', async ({ page }) => {
  await connected(page, true);
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
