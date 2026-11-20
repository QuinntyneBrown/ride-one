// Speed derived from cadence; the bike has no wheel
// sensor (L2-007).
export const KMH_PER_RPM = 0.37497622;
export const KM_PER_MILE = 1.609344;

/** Rounds to 1 decimal, halves to even, as .NET's MidpointRounding.ToEven and Python's round. */
function roundHalfEven1(value: number): number {
  const scaled = value * 10;
  const floor = Math.floor(scaled);
  const diff = scaled - floor;
  const whole = diff > 0.5 || (diff === 0.5 && floor % 2 !== 0) ? floor + 1 : floor;
  return whole / 10;
}

export function toKmh(rpm: number): number {
  return roundHalfEven1(rpm * KMH_PER_RPM);
}

/** From the unrounded km/h value. */
export function toMph(rpm: number): number {
  return roundHalfEven1((rpm * KMH_PER_RPM) / KM_PER_MILE);
}
