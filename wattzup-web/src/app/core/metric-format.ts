// Number formatting for the readouts and the totals strip (L2-021, L2-022).
const thousands = new Intl.NumberFormat('en');

/** A live value: `--` when null. */
export function formatLive(value: number | null): string {
  return value === null ? '--' : String(value);
}

export function formatSpeed(value: number | null): string {
  return value === null ? '--' : value.toFixed(1);
}

/** A ride total in km: 2 decimals, `0.00` before a ride. */
export function formatDistance(value: number | null): string {
  return (value ?? 0).toFixed(2);
}

/** A count with a thousands separator, `0` before a ride. */
export function formatCount(value: number | null): string {
  return thousands.format(value ?? 0);
}
