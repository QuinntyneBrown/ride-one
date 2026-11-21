import type { Page } from '@playwright/test';
import { ECHELON_INITIALISED, echelonBike, targetResistanceWrite } from './echelon';
import { maps } from './maps';
import type { ApiFixture } from './api';
import type { FakeBluetooth } from './fake-bluetooth';
import { expect } from './test';
import { RacePage } from '../pages/race.page';

/** When a race spec's clock starts; the race itself starts a minute later, on a paused clock. */
export const RACE_START = new Date('2026-11-21T18:00:00Z').getTime();

/**
 * Opens a race with the remembered Echelon and starts it on Playwright's paused clock: the map catalogue's answer is
 * held until the bike is initialised and the clock paused, so the race starts at a known time and the spec moves it on
 * by hand. Resolves once the race's first command (the warm-up's level 8) has gone and the page has rendered. With
 * `offline`, the backend answers the catalogue with 503, as when it cannot be reached; `catalogue` serves other maps.
 */
export async function startRace(
  page: Page,
  bluetooth: FakeBluetooth,
  api: ApiFixture,
  mapId: string,
  query: string,
  { offline = false, catalogue = maps as readonly unknown[] } = {},
): Promise<RacePage> {
  let answer: () => void = () => undefined;
  const held = new Promise<void>((resolve) => (answer = resolve));
  api.answer('GET', '/api/maps', async () => {
    await held;
    return offline ? { status: 503 } : { body: catalogue };
  });
  await page.clock.install({ time: RACE_START });
  await bluetooth.remember(echelonBike);
  const race = new RacePage(page);
  await race.open(mapId, query);
  await expect.poll(() => bluetooth.log()).toEqual(ECHELON_INITIALISED);
  await page.clock.pauseAt(RACE_START + 60_000);
  answer();
  await expect
    .poll(() => bluetooth.writes().map((write) => write.hex))
    .toContain(targetResistanceWrite(8));
  await page.clock.runFor(100);
  return race;
}
