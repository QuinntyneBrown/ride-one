// WORKOUT_API (L2-092): the workout engine runs in the page. A refusal is a ContractError.
import { inject, Injectable } from '@angular/core';
import {
  ContractError,
  type PowerTrace,
  type StartPlan,
  type WorkoutApi,
  type WorkoutSnapshot,
} from '@wattzup/api';
import { type RideOrigin, WorkoutEngine } from '../engine/workout-engine';
import { validatePlan, type ValidationErrors } from '../engine/workout-plan-validator';
import { BrowserClassApi } from './browser-class-api';

/** A plan that is not valid, with the messages for each field. */
export function invalidWorkout(errors: ValidationErrors): ContractError {
  return new ContractError('invalid_workout', 'The plan is not valid.', errors);
}

@Injectable()
export class BrowserWorkoutApi implements WorkoutApi {
  private readonly engine = inject(WorkoutEngine);
  private readonly classes = inject(BrowserClassApi);

  async start(plan: StartPlan): Promise<WorkoutSnapshot> {
    // The plan goes through JSON, so the validator sees plain data, as from an imported file.
    const body: unknown = JSON.parse(JSON.stringify(plan));
    const result = validatePlan(body);
    if (!result.plan) throw invalidWorkout(result.errors);
    const classId = (body as { class_id?: unknown }).class_id;
    let origin: RideOrigin | null = null;
    if (classId !== undefined && classId !== null) {
      const entry = await this.classes.find(classId);
      if (!entry) throw invalidWorkout({ class_id: ['No class has that id.'] });
      origin = { classId: entry.id, title: entry.title };
    }
    this.engine.start();
    return this.engine.startWorkout(result.plan, origin);
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
    if (!snapshot) throw new ContractError('no_active_workout', 'No workout is active.');
  }
}
