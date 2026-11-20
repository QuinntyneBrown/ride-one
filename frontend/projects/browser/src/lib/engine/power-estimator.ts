// Estimated power; the bike reports none
// (L2-049, ADR 0003).

/** `max(0, round(cadence × (0.55 + level × 0.155)))`, halves away from zero, or null when either
 * input is null. */
export function estimateWatts(cadence: number | null, level: number | null): number | null {
  if (cadence === null || level === null) return null;
  const watts = cadence * (0.55 + level * 0.155);
  return Math.max(0, Math.sign(watts) * Math.round(Math.abs(watts)));
}
