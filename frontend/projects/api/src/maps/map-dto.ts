/** How hard a map rides (L2-045 AC1). */
export type MapRating = 'Easy' | 'Moderate' | 'Hard' | 'Brutal';

/**
 * One map of the catalogue as `GET /api/maps` serves it (ADR 0029): its facts, its world, its thumbnail in the app, and
 * the goal that opens it, or `null` for a map open from the start (L2-040 AC6).
 */
export interface MapDto {
  readonly id: string;
  readonly name: string;
  readonly routeName: string | null;
  readonly place: string;
  readonly distanceKm: number;
  readonly climbingM: number;
  readonly rating: MapRating;
  readonly world: string;
  readonly thumbnailUrl: string;
  readonly unlockGoal: string | null;
}
