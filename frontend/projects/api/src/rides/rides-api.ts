import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { PackStrengthId, RaceMode } from '../race/race-mode';

/** Which door a ride came through. */
export type RideKind = 'race' | 'class';

/**
 * What every finished ride says of itself (docs/detailed-designs/progression/keep-progress-on-the-backend): the ride id
 * the app gave it when it started, its whole seconds, the metres its speeds add up to, its output in kJ, its highest
 * power and speed, the speed in km/h of each second ridden, so the backend can check the distance (L2-125 AC2), when
 * it finished and the device's IANA time zone.
 */
export interface RideFacts {
  readonly rideId: string;
  readonly elapsedSeconds: number;
  readonly distanceMeters: number;
  readonly outputKj: number;
  readonly maxPowerWatts: number;
  readonly maxSpeedKmh: number;
  readonly speedSamplesKmh: readonly number[];
  /** ISO 8601, in UTC. */
  readonly finishedAt: string;
  readonly timeZoneId: string;
}

/** A finished race: its map, whom it was against, and the rider's place among the field. */
export interface RaceRideFacts {
  readonly kind: 'race';
  readonly mapId: string;
  readonly mode: RaceMode;
  /** The bots' pack strength; none in a solo race. */
  readonly pack: PackStrengthId | null;
  readonly place: number;
  readonly fieldSize: number;
}

/** A finished class. */
export interface ClassRideFacts {
  readonly kind: 'class';
  readonly classId: string;
}

/** A finished ride as the app submits it: facts only, never XP, stars or unlocks, which the backend computes (L2-044 AC4). */
export type SubmitRideRequest = RideFacts & (RaceRideFacts | ClassRideFacts);

/** What the backend answers for a recorded ride, the same for every repeat of its ride id (L2-125 AC3). */
export interface RideRecordedDto {
  readonly rideId: string;
  readonly recordedAt: string;
}

/**
 * The rider's finished rides: `POST /api/rides`, recorded once for its ride id (L2-044 AC2). A ride no one could ride
 * is refused with 422 `ride_not_plausible` (L2-125 AC2).
 */
export interface RidesApi {
  submitRide(ride: SubmitRideRequest): Observable<RideRecordedDto>;
}

export const RIDES_API = new InjectionToken<RidesApi>('RIDES_API');
