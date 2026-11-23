// Acceptance test
// Traces to: L2-153 AC2, AC3, AC5; L2-157 AC1, AC2, AC3; L2-163 AC1; L2-174 AC11; L2-175 AC1
// Description: a solo world class starts when its world is ready and its bike connected. World loading hands its warm
// renderer to the class ride, whose stage shows the world, faded in, with the class video in the corner. (Ibiza
// Sunset Strip has no panorama.) The world's track plays while no class video does.
//
// Given World loading whose bike has dropped, when the world is ready, then the facts read "No bike", an alert says the
// bike isn't connected with Connect bike, and Start riding stays disabled until the bike connects.
// Given the world is ready and the bike connected, when the rider presses Start riding, then the class ride shows the
// world with the video in the corner, faded in, drawn by the renderer World loading warmed up (no
// second graphics context), and the first target resistance is sent.
// Given reduced motion, when the world comes in, then it does so at once.
// Given the class video cannot play, when the class rides in its world, then the world's own track plays.
// Given a ride in Ibiza opens, when the course loads, then the rider built in Blender (`riders/rider.glb`, ADR 0045)
// is fetched with it from the app's own origin, the course is not ready until it has come, and it is drawn with it.
import { bikeBack, loseBike, openRideInIbiza } from './fixtures/class-ride';
import { targetResistanceWrite } from './fixtures/echelon';
import { expect, test } from './fixtures/test';
import { WorldAssets } from './fixtures/world-assets';
import { WorldMusic } from './fixtures/world-music';
import { ClassRidePage } from './pages/class-ride.page';
import { WorldLoadingPage } from './pages/world-loading.page';

const RIDER = '/riders/rider.glb';

test.describe('Starting a world class', () => {
  let assets: WorldAssets;
  let loading: WorldLoadingPage;
  let ride: ClassRidePage;

  // In each, the rider chose Ibiza Sunset Strip on The Class and pressed Start class: the ride is in the course
  // (L2-173 AC5), and World loading opens with the bike connected (L2-087 AC4).
  test.beforeEach(async ({ page }) => {
    assets = await WorldAssets.install(page);
    loading = new WorldLoadingPage(page);
    ride = new ClassRidePage(page);
  });

  test.afterEach(async () => {
    await assets.dispose();
  });

  test('with the bike lost the world keeps loading, and Start riding waits for the bike (L2-157 AC1, AC2, AC3)', async ({
    page,
    bluetooth,
  }) => {
    await openRideInIbiza(page, bluetooth);
    const lost = await loseBike(bluetooth);

    await expect(loading.cardTitle).toHaveText('Ibiza Sunset Strip is ready', { timeout: 60_000 });
    await expect(loading.facts.first()).toHaveText('No bike');
    await expect(loading.alert).toContainText('Your bike isn’t connected.');
    await expect(loading.alert).toContainText(
      'The world keeps loading. Pedal once to wake the bike, then connect it.',
    );
    await expect(loading.connectBike).toBeVisible();
    await expect(loading.start).toBeDisabled();
    await expect(loading.hint).toHaveText(
      'Start riding turns on when the bike is connected and the world is ready.',
    );

    await bluetooth.switchOn();
    await bikeBack(bluetooth, lost);

    await expect(loading.facts.first()).toHaveText('Echelon EX-5s');
    await expect(loading.alert).toHaveCount(0);
    await expect(loading.start).toBeEnabled();
    await expect(loading.start).toBeFocused();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Intervals to the Beat');
  });

  test('Start riding hands the warm world to the class ride, faded in, with the video in the corner (L2-153 AC2, AC3, AC5)', async ({
    page,
    bluetooth,
    webgl,
  }) => {
    // The course is loaded and then drawn in software, and each of the two waits below allows 30 s by itself.
    test.setTimeout(90_000);
    await webgl.countContexts();
    const music = await WorldMusic.install(page);
    await openRideInIbiza(page, bluetooth);
    await expect(loading.cardTitle).toHaveText('Ibiza Sunset Strip is ready', { timeout: 30_000 });
    const contexts = await webgl.contexts();
    expect(contexts).toBeGreaterThan(0);

    await loading.start.click();

    await expect(ride.name).toHaveText('Intervals to the Beat · Solo');
    await expect(ride.worldPanorama).toHaveCount(0);
    await expect(ride.worldScene).toBeVisible();
    // The world fades in once `main`'s scene has measured the display's frame period, 30 frames on a busy machine.
    await expect(ride.worldScene).toHaveCSS('opacity', '1', { timeout: 30_000 });
    await expect(ride.worldScene).toHaveCSS('transition-duration', '0.2s');
    await expect(ride.worldVideo).toBeVisible();
    await expect
      .poll(() => bluetooth.writes().map((write) => write.hex))
      .toContain(targetResistanceWrite(14));
    // Drawn by the renderer World loading warmed up: no second graphics context (L2-153 AC5).
    expect(await webgl.contexts()).toBe(contexts);
    // The class video plays with its own sound, so the world's track does not (L2-163 AC1).
    expect(await music.played()).toEqual([]);
  });

  test('the rider built in Blender is fetched with the course, which is not ready or drawn without it (L2-174 AC11, L2-175 AC1)', async ({
    page,
    bluetooth,
  }) => {
    assets.hold((path) => path === RIDER);
    const answered: string[] = [];
    page.on('response', (response) => {
      const { pathname } = new URL(response.url());
      if (response.ok() && pathname.startsWith('/courses/')) answered.push(pathname);
    });
    await openRideInIbiza(page, bluetooth);

    // The rider's file is asked for as the course's are, when the ride in Ibiza opens.
    await expect.poll(() => assets.paths()).toContain(RIDER);
    await expect
      .poll(() => answered)
      .toEqual(expect.arrayContaining(['/courses/ibiza.glb', '/courses/ibiza.course.json']));
    // The map has come and the rider has not: the course is not ready.
    await expect(loading.cardTitle).toHaveText('Getting Ibiza Sunset Strip ready');
    await expect(loading.start).toBeDisabled();

    const rider = page.waitForResponse((response) => new URL(response.url()).pathname === RIDER);
    await assets.release();

    const file = await rider;
    expect(file.status()).toBe(200);
    expect(file.headers()['content-type']).toBe('model/gltf-binary');
    await expect(loading.cardTitle).toHaveText('Ibiza Sunset Strip is ready', { timeout: 60_000 });
    await loading.start.click();
    await expect(ride.worldScene).toBeVisible();
    await expect(ride.worldScene).toHaveCSS('opacity', '1', { timeout: 30_000 });
  });

  test('with reduced motion the world comes in at once (L2-153 AC3)', async ({
    page,
    bluetooth,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openRideInIbiza(page, bluetooth);
    await expect(loading.cardTitle).toHaveText('Ibiza Sunset Strip is ready', { timeout: 30_000 });

    await loading.start.click();

    // The world fades in once `main`'s scene has measured the display's frame period, 30 frames on a busy machine.
    await expect(ride.worldScene).toHaveCSS('opacity', '1', { timeout: 30_000 });
    await expect(ride.worldScene).toHaveCSS('transition-duration', '0s');
  });

  test('without the class video the world’s own track plays (L2-163 AC1)', async ({
    page,
    bluetooth,
    youtube,
  }) => {
    youtube.block();
    const music = await WorldMusic.install(page);
    await openRideInIbiza(page, bluetooth);
    await expect(loading.start).toBeEnabled({ timeout: 60_000 });

    await loading.start.click();

    await expect(ride.videoNotice).toBeVisible();
    await expect.poll(() => music.played()).toContain('music/ibiza.ogg');
  });

  test('Connect bike tries the bike again after its connection failed (L2-157 AC1, AC3)', async ({
    page,
    bluetooth,
  }) => {
    await openRideInIbiza(page, bluetooth);
    const lost = await loseBike(bluetooth);
    await expect(loading.connectBike).toBeVisible();
    await expect(loading.start).toBeDisabled();
    expect(bluetooth.log().slice(lost)).toEqual([]);

    await bluetooth.switchOn();
    await loading.connectBike.click();

    await bikeBack(bluetooth, lost);
    await expect(loading.facts.first()).toHaveText('Echelon EX-5s');
    await expect(loading.start).toBeEnabled({ timeout: 60_000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Intervals to the Beat');
  });
});
