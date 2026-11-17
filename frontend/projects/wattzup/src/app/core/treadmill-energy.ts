// The treadmill's energy estimate, mirroring TreadmillEnergy in Wattzup.Core (L2-064 AC11, ADR
// 0010): the ACSM walking equation below 6.5 km/h and the running equation from it, for 75 kg.
export const RUNNER_MASS_KG = 75;
const RUNNING_FROM_KMH = 6.5;

/** Kilocalories spent in one second at `speedKmh` and `incline` %. */
export function kcalPerSecond(speedKmh: number, incline: number): number {
  const v = (speedKmh * 1000) / 60;
  const g = incline / 100;
  const vo2 =
    speedKmh < RUNNING_FROM_KMH ? 0.1 * v + 1.8 * v * g + 3.5 : 0.2 * v + 0.9 * v * g + 3.5;
  return (vo2 * RUNNER_MASS_KG * 5) / 1000 / 60;
}
