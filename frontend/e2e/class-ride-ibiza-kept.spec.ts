// Acceptance test
// Traces to: L2-175 AC4, AC5; L2-135 AC1
// Description: the course is kept on the device after its first load. With the service worker in control, a ride in
// Ibiza fetches the course's files once; a second ride, with the network gone, still draws the course from what the
// worker kept. The only other spec that lets a service worker run is app-cache.spec.ts (playwright.config.ts).
//
// Given the course has been loaded once on this device, when the network is lost and the rider rides in Ibiza again,
// then the course is drawn, with its still gone and no notice that it cannot be drawn.
import { appCached } from './fixtures/app-cache';
import { openTheClassForIbiza } from './fixtures/class-ride';
import { expect, test } from './fixtures/test';
import { ClassRidePage } from './pages/class-ride.page';

test.use({ serviceWorkers: 'allow' });

test('a ride in Ibiza draws the course again with no network, from what the first ride kept (L2-175 AC4, AC5)', async ({
  page,
  context,
  bluetooth,
  course,
}) => {
  // The course is drawn in software once: the smallest landscape window, at the lowest step.
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await course.pin('low');

  // The app is cached on the device, and the worker is in control of the page.
  let home = await openTheClassForIbiza(page, bluetooth);
  await appCached(page);
  await page.reload();
  home = await openTheClassForIbiza(page, bluetooth);

  // The first ride loads the course from the network, and the worker keeps what it fetched: the rider leaves once
  // all three files are on the device, without waiting for the course to be drawn.
  await home.start.click();
  const first = new ClassRidePage(page);
  await expect(first.clock).toBeVisible();
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const wanted = ['/courses/ibiza.course.json', '/courses/ibiza.glb', '/riders/rider.glb'];
          const name = (await caches.keys()).find((key) => key.endsWith(':assets:assets:cache'));
          if (name === undefined) return 'no cache of the lazy assets';
          const cache = await caches.open(name);
          const kept = await Promise.all(wanted.map((path) => cache.match(path)));
          return kept.every((response) => response !== undefined) ? 'kept' : 'not all kept yet';
        }),
      { message: 'the worker keeps the course’s files', timeout: 60_000 },
    )
    .toBe('kept');
  await first.leave.click();
  await expect(page).toHaveURL('/');

  // The network is gone: the second ride draws the course from what was kept.
  await context.setOffline(true);
  await expect(home.start).toBeEnabled();
  await home.start.click();
  const second = new ClassRidePage(page);
  await expect(second.course).toBeVisible({ timeout: 90_000 });
  await expect(second.courseStill).toHaveCount(0);
  await expect(second.courseNotice).toHaveCount(0);
});
