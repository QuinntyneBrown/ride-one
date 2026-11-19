import type { ClassEntry, WorkoutSnapshot } from '@wattzup/api';
import { isActive } from './workout-status';

export type WorldRideAccess = 'show' | 'class-page';

/**
 * Whether `/classes/<routeId>/world` shows the ride: only a ride in progress of that class, whose
 * class names a world; anything else goes to the class page (L2-090 AC3, AC4).
 */
export function worldRideAccess(
  routeId: string,
  entry: Pick<ClassEntry, 'world'>,
  workout: WorkoutSnapshot | null | undefined,
): WorldRideAccess {
  return entry.world !== null && isActive(workout) && workout.class_id === routeId
    ? 'show'
    : 'class-page';
}
