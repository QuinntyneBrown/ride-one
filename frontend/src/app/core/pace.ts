// Pace at the reported treadmill speed (L2-071 criterion 3).

/** 60 ÷ speed minutes per km as `m:ss`; `--` at speed 0 or null. */
export function formatPace(speedKmh: number | null): string {
  if (speedKmh === null || speedKmh <= 0) return '--';
  const seconds = Math.round(3600 / speedKmh);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
