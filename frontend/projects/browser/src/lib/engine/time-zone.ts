// The rider's time zone, which Progress counts days in (L2-087, L2-094 AC8). It is the browser's
// zone; tests pass a fixed one.

export interface TimeZone {
  /** The zone's offset from UTC, in milliseconds, at the instant `utcMs`. */
  offsetMs(utcMs: number): number;
}

export const BROWSER_TIME_ZONE: TimeZone = {
  offsetMs: (utcMs) => -new Date(utcMs).getTimezoneOffset() * 60_000,
};

export const fixedOffset = (hours: number): TimeZone => ({ offsetMs: () => hours * 3_600_000 });

const DAY_MS = 86_400_000;

/** `yyyy-mm-dd` of the local day of `utcMs`, as .NET writes a DateOnly. */
export function localDay(utcMs: number, zone: TimeZone): string {
  return new Date(utcMs + zone.offsetMs(utcMs)).toISOString().slice(0, 10);
}

/** `day` moved by `days`. */
export function addDays(day: string, days: number): string {
  return new Date(Date.parse(day + 'T00:00:00Z') + days * DAY_MS).toISOString().slice(0, 10);
}

/** 0 for Sunday to 6 for Saturday, as .NET's DayOfWeek. */
export function dayOfWeek(day: string): number {
  return new Date(day + 'T00:00:00Z').getUTCDay();
}

/** The UTC instant of local midnight at the start of `day`. */
export function localMidnight(day: string, zone: TimeZone): number {
  const wall = Date.parse(day + 'T00:00:00Z');
  return wall - zone.offsetMs(wall - zone.offsetMs(wall));
}
