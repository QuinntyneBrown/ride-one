// Acceptance test
// Traces to: L2-074 AC1, AC2, AC3, AC4; L2-075 AC3
// Description: Results shows what the ride earned from the backend's answer. The XP panel waits while the ride is
// recorded, then shows "XP earned", the total and each line in the order returned; a class has no stars panel. With no
// network the panel says the XP will be added when the rider is back online, and fills once they are; a refused ride
// earned no XP.
import type { Request } from '@playwright/test';
import { startClassRide } from './fixtures/class-ride';
import { echelonBike } from './fixtures/echelon';
import { openResults, recorded, soloClass } from './fixtures/results';
import { expect, test } from './fixtures/test';
import { ResultsPage } from './pages/results.page';

test.describe('XP earned', () => {
  test(
    'after a class the XP panel waits, then shows the XP line by line, with no stars panel (L2-074 AC1, AC2, L2-075 AC3)',
    { tag: '@critical' },
    async ({ page, bluetooth, api }) => {
      let answer: () => void = () => undefined;
      const held = new Promise<void>((resolve) => (answer = resolve));
      api.answer('POST', '/api/rides', async (request: Request) => {
        await held;
        return {
          status: 201,
          body: recorded(request.postDataJSON() as { rideId: string }, [
            ['Finished', 100],
            ['0% on target', 0],
            ['4-day streak', 40],
          ]),
        };
      });
      await startClassRide(page, bluetooth, api);
      await page.clock.fastForward('29:58');
      await page.clock.runFor(2100);
      const results = new ResultsPage(page);
      await results.shown();

      await expect(results.xpNote).toHaveText('Recording your ride…');

      answer();
      // The page's clock is paused, so it is stepped until the answer has rendered.
      await expect(async () => {
        await page.clock.runFor(16);
        await expect(results.xpTotal).toHaveText('+140', { timeout: 50 });
      }).toPass({ intervals: [0] });
      expect(await results.xpLineTexts()).toEqual([
        'Finished +100',
        '0% on target +0',
        '4-day streak +40',
      ]);
      await expect(results.xpNote).toHaveCount(0);
      await expect(results.starsPanel).toHaveCount(0);
      await expect(results.lead).toHaveText('You finished');
      await expect(results.big).toHaveText('30:00');
    },
  );

  test.describe('opened again after a reload', () => {
    test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

    test('a class shows its XP and no stars panel (L2-075 AC3)', async ({ page }) => {
      await openResults(page, soloClass());
      const results = new ResultsPage(page);

      await expect(results.xpTotal).toHaveText('+110');
      expect(await results.xpLineTexts()).toEqual(['Finished +100', '1-day streak +10']);
      await expect(results.starsPanel).toHaveCount(0);
    });

    test('with no network the XP panel says it will be added when back online, and fills once the rider is (L2-074 AC3)', async ({
      page,
      api,
    }) => {
      const state = soloClass();
      api.answer('POST', '/api/rides', () => ({ offline: true }));
      await openResults(page, state);
      const results = new ResultsPage(page);

      await expect(results.xpNote).toHaveText('Your XP will be added when you’re back online.');
      await expect(results.starsPanel).toHaveCount(0);

      api.answer('POST', '/api/rides', recorded(state.ride, [['Finished', 100]]));
      await page.evaluate(() => window.dispatchEvent(new Event('online')));
      await expect(results.xpTotal).toHaveText('+100');
      await expect(results.xpNote).toHaveCount(0);
    });

    test('a refused ride earned no XP and has no stars panel (L2-074 AC4)', async ({
      page,
      api,
    }) => {
      api.answer('POST', '/api/rides', () => ({
        status: 422,
        body: {
          status: 422,
          title: 'No one could have ridden this ride.',
          code: 'ride_not_plausible',
        },
      }));
      await openResults(page, soloClass());
      const results = new ResultsPage(page);

      await expect(results.xpNote).toHaveText('This ride wasn’t recorded, so it earned no XP.');
      await expect(results.starsPanel).toHaveCount(0);
    });
  });
});
