// The workout API contract (L2-017). Components inject WORKOUT_API, never HttpWorkoutApi.
import { InjectionToken } from '@angular/core';
import type { PowerTrace, WorkoutPlan, WorkoutSnapshot } from './api-types';

export interface WorkoutApi {
  start(plan: WorkoutPlan): Promise<WorkoutSnapshot>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  backToPlan(): Promise<void>;
  trace(): Promise<PowerTrace>;
}

export const WORKOUT_API = new InjectionToken<WorkoutApi>('WORKOUT_API');
