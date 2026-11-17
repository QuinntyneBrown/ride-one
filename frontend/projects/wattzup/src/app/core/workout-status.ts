import type { WorkoutSnapshot, WorkoutStatus } from '@wattzup/api';

const TERMINAL: readonly WorkoutStatus[] = ['ended', 'ended: bike shut off', 'stopped'];

/** A workout whose status is waiting, running or paused (L2-014). */
export function isActive(workout: WorkoutSnapshot | null | undefined): workout is WorkoutSnapshot {
  return !!workout && !TERMINAL.includes(workout.status);
}
