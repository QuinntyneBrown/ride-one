// Mirrors Wattzup.Core/Workouts/RideTotals.cs: what a ride has added up over its running seconds
// (L2-049).
import { roundAwayFromZero } from './rounding';

export class RideTotals {
  static readonly EMPTY = new RideTotals(0, 0, 0);

  constructor(
    readonly runningSeconds: number,
    readonly powerSum: number,
    readonly distanceKm: number,
  ) {}

  tick(power: number | null, speedKmh: number | null): RideTotals {
    return new RideTotals(
      this.runningSeconds + 1,
      this.powerSum + (power ?? 0),
      this.distanceKm + (speedKmh ?? 0) / 3600,
    );
  }

  get avgPower(): number {
    return this.runningSeconds === 0 ? 0 : roundAwayFromZero(this.powerSum / this.runningSeconds);
  }

  get distanceKmRounded(): number {
    return roundAwayFromZero(this.distanceKm, 2);
  }

  get kcal(): number {
    return roundAwayFromZero((this.avgPower * this.runningSeconds) / 1000 / 0.24 / 4.184);
  }
}
