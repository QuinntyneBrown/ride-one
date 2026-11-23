// Acceptance test
// Traces to: L2-084 AC1 to AC3; L2-085 AC4; L2-080 AC3
// Description: Class Start at `/` reads the class's channel, length and focus, its title and its summary. "What the
// bike will do" reads the class's length, its resistance profile and its structure with the expected average power.
// The class video waits, parked at its sync offset with YouTube's controls. "Video link and sync", collapsed at first,
// shows the link and the offset. Start class opens the ride, solo. With no catalogue to read and none kept, it says
// the class can't be loaded, and Try again reads it.
import { echelonBike } from './fixtures/echelon';
import { catalogue } from './fixtures/classes';
import { connectBike } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';
import { ClassStartPage } from './pages/class-start.page';

test.describe('Class Start', () => {
  test.beforeEach(({ bluetooth }) => bluetooth.remember(echelonBike));

  test('Class Start names the class: its channel, length and focus, its title and its summary (L2-084 AC1) @critical', async ({
    page,
  }) => {
    const start = new ClassStartPage(page);
    await start.open();

    await expect(page).toHaveURL('/');
    await expect(start.title).toHaveText('30 Minute HIIT Cardio');
    await expect(start.meta).toHaveText('GCN Training · 30 min · HIIT');
    await expect(start.summary).toHaveText(
      'Eight 30-second maximal efforts with a recovery that shrinks each round. The classic.',
    );
  });

  test('What the bike will do reads the length, the resistance profile and the structure with its average power (L2-084 AC2)', async ({
    page,
  }) => {
    const start = new ClassStartPage(page);
    await start.open();

    await expect(start.planTotal).toHaveText('30:00');
    await expect(start.profile).toBeVisible();
    await expect(start.planSummary).toHaveText('8 × 0:30 · 3:00 → 1:30 recover · ~154 W average');
  });

  test('the class video waits parked at its sync offset, with its controls (L2-084 AC1)', async ({
    page,
    youtube,
  }) => {
    const start = new ClassStartPage(page);
    await start.open();

    await expect.poll(async () => (await youtube.players()).length).toBe(1);
    const [player] = await youtube.players();
    expect(player.videoId).toBe('QUoToFsMNig');
    expect(player.playerVars).toMatchObject({ start: 12, controls: 1 });
    await expect
      .poll(async () => (await youtube.players())[0].title)
      .toBe('Video: 30 Minute HIIT Cardio');
    expect((await youtube.players())[0].playing).toBe(false);
    expect(await youtube.seeks()).toEqual([]);
  });

  test('Video link and sync is collapsed at first, and expanded shows the video link and the sync offset (L2-084 AC3)', async ({
    page,
  }) => {
    const start = new ClassStartPage(page);
    await start.open();

    await expect(start.syncToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(start.syncLink).toHaveCount(0);

    await start.syncToggle.click();
    await expect(start.syncToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(start.syncLink).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=QUoToFsMNig',
    );
    await expect(start.syncLink).toHaveAttribute('target', '_blank');
    await expect(start.syncOffset).toHaveText('Synced from 0:12.0');
  });

  test('Start class opens the ride, solo (L2-085 AC4) @critical', async ({
    page,
    bluetooth,
    webgl,
  }) => {
    await webgl.disable();
    const start = new ClassStartPage(page);
    await start.open();

    await start.start.click();
    await expect(page).toHaveURL('/classes/hiit-cardio-30/ride?mode=solo');
    // A world class opens World loading before the ride (L2-151 AC1).
    const loading = new WorldLoadingPage(page);
    await expect(loading.title).toHaveText('30 Minute HIIT Cardio');
    await connectBike(bluetooth);
    await loading.startRiding();
    await expect(new ClassRidePage(page).name).toContainText('30 Minute HIIT Cardio');
  });

  test('with no catalogue to read or kept, it says the class can’t be loaded, and Try again reads it (L2-080 AC3)', async ({
    page,
    api,
  }) => {
    api.answer('GET', '/api/classes', () => ({ status: 503 }));
    const start = new ClassStartPage(page);
    await start.open();

    await expect(start.unavailable).toContainText(
      'The class can’t be loaded. Check your connection and try again.',
    );
    await expect(start.start).toHaveCount(0);

    api.answer('GET', '/api/classes', catalogue);
    await start.retry.click();

    await expect(start.title).toHaveText('30 Minute HIIT Cardio');
    await expect(start.unavailable).toHaveCount(0);
  });
});
