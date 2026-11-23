import type { Page } from '@playwright/test';

/**
 * Results as a reload finds it: the result and the ride a finished ride left in the navigation's state. Results submits
 * the ride again, and the backend answers a repeat as it did the first time (L2-125 AC3), so the panels fill as they
 * did. Each ride gets a new id.
 */
export async function openResults(page: Page, state: object): Promise<void> {
  await page.goto('/');
  await page.evaluate((s) => history.replaceState(s, '', '/results'), state);
  await page.reload();
}

/** A ride's facts as the ride submits them, for the given time. */
function rideFacts(elapsedSeconds: number, ride: object) {
  return {
    rideId: crypto.randomUUID(),
    elapsedSeconds,
    distanceMeters: 14_200,
    outputKj: 450,
    maxPowerWatts: 410,
    maxSpeedKmh: 32,
    onTargetShare: 0.84,
    speedSamplesKmh: [],
    finishedAt: '2026-11-21T07:30:00.000Z',
    timeZoneId: 'Europe/London',
    ...ride,
  };
}

/** 30 Minute HIIT Cardio, ridden alone to its end. */
export function soloClass() {
  return {
    classResult: {
      classId: 'hiit-cardio-30',
      title: '30 Minute HIIT Cardio',
      elapsedSeconds: 1800,
      outputKj: 341.6,
      onTargetShare: 0.838,
    },
    ride: { ...rideFacts(1800, { kind: 'class', classId: 'hiit-cardio-30' }), distanceMeters: 0 },
  };
}

/** The backend's answer for `ride`: the XP lines given. A class earns no stars, sets no best and opens no map. */
export function recorded(ride: { rideId: string }, lines: [string, number][]) {
  const xpTotal = lines.reduce((sum, [, xp]) => sum + xp, 0);
  return {
    rideId: ride.rideId,
    recordedAt: '2026-11-21T07:31:00Z',
    xpLines: lines.map(([label, xp]) => ({ kind: 'finished', label, xp })),
    xpTotal,
    totalXp: 1840 + xpTotal,
    level: 7,
    levelUp: false,
    nextLevelXp: 2600,
    xpToNextLevel: 2600 - 1840 - xpTotal,
    stars: null,
    best: null,
    openedMapId: null,
  };
}
