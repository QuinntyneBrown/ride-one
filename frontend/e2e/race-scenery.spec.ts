// Acceptance test
// Traces to: L2-066 AC1, AC2, AC5, AC9
// Description: on a map that follows a real place, while its world draws, the race offers to stream the place as
// photorealistic 3D Tiles with the rider's own Google Maps Platform key; a map with no real place, or a race on its
// panorama, offers nothing.
import { startRace, stepUntil } from './fixtures/race';
import { expect, test } from './fixtures/test';

test.describe('the real-world scenery panel', () => {
  test.slow();

  test('offers the real Bruges on Old Town Criterium, with Stream it disabled until there is a key (L2-066 AC1, AC2)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await webgl.withoutWebGpu();
    await worldRide.pin('low');
    const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo', {
      world: true,
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));

    await expect(race.sceneryTitle).toHaveText('Ride the real Bruges · Steenstraat to the Markt');
    await expect(race.sceneryBody).toHaveText(
      'Paste a Google Maps Platform key to stream it as photorealistic 3D Tiles. It stays on this device.',
    );
    await expect(race.sceneryKey).toHaveAttribute('placeholder', 'AIza…');
    await expect(race.streamIt).toBeDisabled();

    // The race's clock is paused, so the page renders as the clock steps.
    await race.sceneryKey.fill('AIzaSyD-telo-ride-test');
    await stepUntil(page, () => expect(race.streamIt).toBeEnabled({ timeout: 50 }));
    await race.sceneryKey.fill('   ');
    await stepUntil(page, () => expect(race.streamIt).toBeDisabled({ timeout: 50 }));
  });

  test('offers nothing on a map with no real place (L2-066 AC5)', async ({
    page,
    bluetooth,
    api,
    webgl,
    worldRide,
  }) => {
    await webgl.withoutWebGpu();
    await worldRide.pin('low');
    const race = await startRace(page, bluetooth, api, 'prairie-paceline', 'mode=solo', {
      world: true,
    });
    await stepUntil(page, () => expect(race.backend).toBeVisible({ timeout: 50 }));

    await expect(race.scenery).toHaveCount(0);
  });

  test('offers nothing over the panorama, where no world draws (L2-066 AC9)', async ({
    page,
    bluetooth,
    api,
  }) => {
    const race = await startRace(page, bluetooth, api, 'old-town-criterium', 'mode=solo');
    await stepUntil(page, () => expect(race.world).toHaveCount(0, { timeout: 50 }));
    await page.clock.runFor(2000);

    await expect(race.panorama).toBeVisible();
    await expect(race.scenery).toHaveCount(0);
  });
});
