// WORKOUT_API in the browser edition (L2-092): the workout engine runs in the page. Answers and
// failures match POST /api/workout and its commands, so the screens are unchanged (L2-088 AC5).
import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { PowerTrace, StartPlan, WorkoutApi, WorkoutSnapshot } from '@wattzup/api';
import { WorkoutEngine } from '../engine/workout-engine';
import { validatePlan, type ValidationErrors } from '../engine/workout-plan-validator';
import { problem } from './browser-bike-api';

/** POST /api/workout's 400: a ValidationProblem with code `invalid_workout`. */
export function invalidWorkout(errors: ValidationErrors): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 400,
    error: { status: 400, title: 'The plan is not valid.', code: 'invalid_workout', errors },
  });
}

@Injectable()
export class BrowserWorkoutApi implements WorkoutApi {
  private readonly engine = inject(WorkoutEngine);

  async start(plan: StartPlan): Promise<WorkoutSnapshot> {
    // The plan goes through JSON, as it would to the API, so the validator sees what it would.
    const body: unknown = JSON.parse(JSON.stringify(plan));
    const result = validatePlan(body);
    if (!result.plan) throw invalidWorkout(result.errors);
    const classId = (body as { class_id?: unknown }).class_id;
    if (classId !== undefined && classId !== null) {
      // The class library comes to the browser edition with L2-096.
      throw invalidWorkout({ class_id: ['No class has that id.'] });
    }
    this.engine.start();
    return this.engine.startWorkout(result.plan, null);
  }

  async stop(): Promise<string | null> {
    return (await this.engine.stop())?.session_id ?? null;
  }

  async pause(): Promise<void> {
    this.orConflict(await this.engine.pause());
  }

  async resume(): Promise<void> {
    this.orConflict(await this.engine.resume());
  }

  async backToPlan(): Promise<void> {
    this.orConflict(await this.engine.backToPlan());
  }

  async trace(): Promise<PowerTrace> {
    return this.engine.trace();
  }

  private orConflict(snapshot: WorkoutSnapshot | null): void {
    if (!snapshot) throw problem(409, 'no_active_workout', 'No workout is active.');
  }
}
