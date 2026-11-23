import type { Page } from '@playwright/test';
import {
  ECHELON_INITIALISED,
  ECHELON_NOTIFY,
  echelonBike,
  resistanceFrame,
  targetResistanceWrite,
} from './echelon';
import type { ApiFixture } from './api';
import type { FakeBike, FakeBluetooth } from './fake-bluetooth';
import { INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME, ftmsBike } from './ftms';
import { expect } from './test';
import { ClassRidePage } from '../pages/class-ride.page';
import { TheClassPage } from '../pages/the-class.page';
import { WorldLoadingPage } from '../pages/world-loading.page';
import { theClass } from './the-class';
import { keptRideWith } from './how-to-ride';
import { YouTubeFixture } from './youtube';

/** When a class ride spec's clock starts; the ride itself starts a minute later, on a paused clock. */
export const RIDE_START = new Date('2026-11-21T18:00:00Z').getTime();

/**
 * Connects the remembered Echelon: once its latest initialisation has gone (a reload starts it again), it reports its
 * resistance, so `ble` is connected and Start riding can turn on (L2-157 AC3).
 */
export async function connectBike(bluetooth: FakeBluetooth): Promise<void> {
  await expect
    .poll(() => bluetooth.log().slice(-ECHELON_INITIALISED.length))
    .toEqual(ECHELON_INITIALISED);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
}

/**
 * Starts Intervals to the Beat with the class video, as a rider does, on Playwright's paused clock: The Class opens
 * with the remembered Echelon on the running clock, and once the bike is connected and the video's box has settled
 * the clock is paused and the spec presses Start class, so the ride starts at a known time and the spec moves it on
 * by hand. Change detection waits on a timer, so the paused clock is stepped a millisecond at a time until the ride's
 * first command has gone. Resolves once the page has rendered, a tenth of a second into the ride. The player The
 * Class parked is forgotten before the ride starts, so `youtube.players()` lists the ride's own. The class ships with
 * the app, so no request is answered for it (ADR 0037); `api` is taken so the shared fixture watches for one.
 */
export async function startClassRide(
  page: Page,
  bluetooth: FakeBluetooth,
  api: ApiFixture,
): Promise<ClassRidePage> {
  void api;
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(echelonBike);
  const home = new TheClassPage(page);
  await home.open();
  await connectBike(bluetooth);
  await expect(home.start).toHaveText('Start class');
  await home.videoSettled();
  await YouTubeFixture.forgetPlayers(page);
  await page.clock.pauseAt(RIDE_START + 60_000);
  await home.start.click();
  // The ride starts the moment Class Ride opens, and its first command shows it has.
  await expect
    .poll(async () => {
      await page.clock.runFor(1);
      return bluetooth.writes().map((write) => write.hex);
    })
    .toContain(targetResistanceWrite(theClass.segments[0].level));
  await page.clock.runFor(100);
  return new ClassRidePage(page);
}

/**
 * Starts Intervals to the Beat with the class video on a remembered FTMS bike (L2-014), on Playwright's paused clock,
 * as `startClassRide` does on the Echelon. An FTMS bike needs no initialisation: it is connected by its first Indoor
 * Bike Data, which a bike sends about once a second, so the frame is sent until the start button turns on. Resolves
 * with Class Ride open at 0:00; the ride's first target asks the bike for control, which the spec answers or not.
 */
export async function startClassRideOnFtms(
  page: Page,
  bluetooth: FakeBluetooth,
  bike: FakeBike = ftmsBike,
): Promise<ClassRidePage> {
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(bike);
  const home = new TheClassPage(page);
  await home.open();
  await expect.poll(() => bluetooth.log()).toContain(`subscribe ${INDOOR_BIKE_DATA}`);
  await expect(async () => {
    await bluetooth.notify(INDOOR_BIKE_DATA, INDOOR_BIKE_FRAME);
    await expect(home.start).toHaveText('Start class', { timeout: 250 });
  }).toPass();
  await home.videoSettled();
  await YouTubeFixture.forgetPlayers(page);
  await page.clock.pauseAt(RIDE_START + 60_000);
  await home.start.click();
  const ride = new ClassRidePage(page);
  await expect(async () => {
    await page.clock.runFor(1);
    await expect(ride.clock).toBeVisible({ timeout: 50 });
  }).toPass();
  return ride;
}

/**
 * Starts a ride in Ibiza as a rider does (L2-173 AC5, L2-087 AC4): Ibiza Sunset Strip is the kept choice, The Class
 * opens with the remembered Echelon, the bike connects, and the rider presses Start class. The carried-over ride in
 * the course opens World loading at the ride's address, with the bike connected. On the running clock.
 */
export async function openRideInIbiza(page: Page, bluetooth: FakeBluetooth): Promise<void> {
  await keptRideWith(page, 'ibiza');
  await bluetooth.remember(echelonBike);
  const home = new TheClassPage(page);
  await home.open();
  await connectBike(bluetooth);
  await expect(home.start).toHaveText('Start class');
  await home.start.click();
  await expect(new WorldLoadingPage(page).root).toBeVisible();
}

/**
 * The bike is switched off and its link drops, so it stays lost until `bikeBack`. Resolves to the length of the
 * bike's log at the drop, which `bikeBack` reads from.
 */
export async function loseBike(bluetooth: FakeBluetooth): Promise<number> {
  await bluetooth.switchOff();
  await bluetooth.drop();
  return bluetooth.log().length;
}

/**
 * The bike lost at `since` is back: once the app has initialised it again (on its own retry, or at once when the
 * rider presses the screen's Connect bike or Reconnect), it reports its resistance and `ble` is connected.
 */
export async function bikeBack(bluetooth: FakeBluetooth, since: number): Promise<void> {
  await expect.poll(() => bluetooth.log().slice(since)).toEqual(ECHELON_INITIALISED);
  await bluetooth.notify(ECHELON_NOTIFY, resistanceFrame(6));
}

/**
 * Opens Intervals to the Beat with the remembered Echelon and Ibiza Sunset Strip chosen (L2-173), and rides it in its world, on the running clock: World
 * loading builds Ibiza Sunset Strip and warms it up, the bike connects, the rider presses Start riding, and the world
 * has faded in over its panorama. The world is drawn, in software here, so a spec that takes WebGPU away draws it with
 * WebGL 2.
 */
export async function startClassRideInWorld(
  page: Page,
  bluetooth: FakeBluetooth,
  api: ApiFixture,
): Promise<ClassRidePage> {
  void api;
  const ride = new ClassRidePage(page);
  const loading = new WorldLoadingPage(page);
  await openRideInIbiza(page, bluetooth);
  await expect(loading.cardTitle).toHaveText('Ibiza Sunset Strip is ready', { timeout: 60_000 });
  await loading.start.click();
  // The world fades in once `main`'s scene has measured the display's frame period, 30 frames on a busy machine.
  await expect(ride.worldScene).toHaveCSS('opacity', '1', { timeout: 60_000 });
  return ride;
}
