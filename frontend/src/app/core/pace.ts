// Pace on the treadmill (L2-071 criteria 2 and 7).

/** Shown for a pace that cannot be read. */
export const NO_PACE = '–:––';

const mss = (seconds: number): string =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

/** 3600 ÷ speed seconds per km as `m:ss`; `–:––` below 0.5 km/h or for null. */
export function formatPace(speedKmh: number | null): string {
  if (speedKmh === null || speedKmh < 0.5) return NO_PACE;
  return mss(Math.round(3600 / speedKmh));
}

/** Elapsed seconds ÷ distance as `m:ss` per km; `–:––` while the distance is 0 or null. */
export function formatAvgPace(elapsedSeconds: number, distanceKm: number | null): string {
  if (!distanceKm || distanceKm <= 0) return NO_PACE;
  return mss(Math.round(elapsedSeconds / distanceKm));
}
