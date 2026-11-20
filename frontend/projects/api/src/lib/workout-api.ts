// The workout API contract (L2-017). Components inject WORKOUT_API.
import { InjectionToken } from '@angular/core';
import type { PowerTrace, StartPlan, WorkoutSnapshot } from './api-types';

export interface WorkoutApi {
  start(plan: StartPlan): Promise<WorkoutSnapshot>;
  /** Stops the ride; answers the saved session's id, or null when none was saved (L2-081 AC8). */
  stop(): Promise<string | null>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  backToPlan(): Promise<void>;
  trace(): Promise<PowerTrace>;
}

export const WORKOUT_API = new InjectionToken<WorkoutApi>('WORKOUT_API');
