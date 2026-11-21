import type { PackStrengthId, RaceMode } from './race-mode';

/**
 * A finished race's result, which the race hands to Results in the navigation's state (docs/detailed-designs/race/
 * finish-a-race, L2-071 AC1, AC3): the map, whom it was against, the finish time on the race clock and the rider's
 * place where they crossed the line among the field.
 */
export interface RaceResult {
  readonly mapId: string;
  readonly mode: RaceMode;
  /** The bots' pack strength; none in a solo race. */
  readonly pack: PackStrengthId | null;
  /** Whole seconds of the race clock at the line. */
  readonly finishTimeS: number;
  /** 1 for the winner. */
  readonly place: number;
  /** Riders in the race, the rider among them. */
  readonly field: number;
}
