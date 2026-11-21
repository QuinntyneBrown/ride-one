import type { Page } from '@playwright/test';
import { hiitCardio } from './classes';
import { ECHELON_INITIALISED, echelonBike, targetResistanceWrite } from './echelon';
import type { ApiFixture } from './api';
import type { FakeBluetooth } from './fake-bluetooth';
import { expect } from './test';
import { ClassRidePage } from '../pages/class-ride.page';

/** When a class ride spec's clock starts; the ride itself starts a minute later, on a paused clock. */
export const RIDE_START = new Date('2026-11-21T18:00:00Z').getTime();

/**
 * Opens 30 Minute HIIT Cardio solo with the remembered Echelon and starts it on Playwright's paused clock: the class's
 * answer is held until the bike is initialised and the clock paused, so the ride starts at a known time and the spec
 * moves it on by hand. Resolves once the ride's first command has gone and the page has rendered.
 */
export async function startClassRide(
  page: Page,
  bluetooth: FakeBluetooth,
  api: ApiFixture,
): Promise<ClassRidePage> {
  let answer: (body: unknown) => void = () => undefined;
  const held = new Promise((resolve) => (answer = resolve));
  api.answer('GET', `/api/classes/${hiitCardio.id}`, async () => ({ body: await held }));
  await page.clock.install({ time: RIDE_START });
  await bluetooth.remember(echelonBike);
  const ride = new ClassRidePage(page);
  await ride.open(hiitCardio.id);
  await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
  await page.clock.pauseAt(RIDE_START + 60_000);
  answer(hiitCardio);
  // The ride starts the moment the class arrives, and its first command shows it has.
  await expect
    .poll(() => bluetooth.writes().map((write) => write.hex))
    .toContain(targetResistanceWrite(8));
  await page.clock.runFor(100);
  return ride;
}
