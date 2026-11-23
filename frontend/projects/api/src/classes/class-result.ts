/**
 * A finished class's result, which the class hands to Class Done in the navigation's state (L2-078 AC1): the class,
 * its title, its length, the output in kJ, the share of running seconds on target and the best before it.
 */
export interface ClassResult {
  readonly classId: string;
  readonly title: string;
  readonly elapsedSeconds: number;
  readonly outputKj: number;
  /** From 0 to 1. */
  readonly onTargetShare: number;
  /**
   * The best output in whole kJ before this ride was recorded, or `null` for the rider's first finished ride. Carried
   * with the result so a reload still compares with the earlier best, not with this ride (L2-077).
   */
  readonly previousBestKj: number | null;
  /** Each effort's average watts, rounded, in plan order (L2-169). */
  readonly efforts: readonly number[];
}
