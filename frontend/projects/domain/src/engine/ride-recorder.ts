import type { RideFacts } from '@telo/api';

/** To two decimals: the speeds and the distance a ride sends. */
const hundredths = (value: number) => Math.round(value * 100) / 100;

/**
 * A ride's record from its start to its finish, for the backend to record it (Record a ride, L2-044 AC2). It gives the
 * ride its id when the ride starts. For each second ridden it keeps the speed the ride moves at (a race's virtual
 * speed, a class's bike speed) in a buffer sized for four hours, and adds the power to the output; seconds a hidden
 * tab skipped count at the power and speed of the moment, and an unknown power or speed counts as none. The distance is
 * what the speeds sent add up to, to the hundredth, so the backend's check of one against the other holds (L2-125 AC2).
 * Nothing is kept past four hours, the longest ride the backend records.
 */
export class RideRecorder {
  static readonly maxSeconds = 14_400;

  private readonly rideId = crypto.randomUUID();
  private readonly speedsKmh = new Float64Array(RideRecorder.maxSeconds);
  private seconds = 0;
  private joules = 0;
  private topPowerW = 0;

  /** `seconds` seconds ridden at `powerW` and `speedKmh`. */
  record(powerW: number | null, speedKmh: number | null, seconds = 1): void {
    const power = powerW ?? 0;
    const speed = hundredths(speedKmh ?? 0);
    const kept = Math.min(seconds, RideRecorder.maxSeconds - this.seconds);
    if (kept <= 0) return;
    this.speedsKmh.fill(speed, this.seconds, this.seconds + kept);
    this.seconds += kept;
    this.joules += power * kept;
    this.topPowerW = Math.max(this.topPowerW, power);
  }

  /** The ride's facts as the backend reads them, finished at `finishedAt` on this device's time zone. */
  facts(finishedAt: Date): RideFacts {
    const speedSamplesKmh = Array.from(this.speedsKmh.subarray(0, this.seconds));
    return {
      rideId: this.rideId,
      elapsedSeconds: this.seconds,
      distanceMeters: hundredths(speedSamplesKmh.reduce((metres, kmh) => metres + kmh / 3.6, 0)),
      outputKj: Math.round(this.joules) / 1000,
      maxPowerWatts: Math.round(this.topPowerW),
      maxSpeedKmh: speedSamplesKmh.reduce((top, kmh) => Math.max(top, kmh), 0),
      speedSamplesKmh,
      finishedAt: finishedAt.toISOString(),
      timeZoneId: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
}
