// The app bar's ride commands: Pause, Resume and End (L2-046, L2-051).
import { Injectable, inject } from '@angular/core';
import { WORKOUT_API } from './workout-api';

@Injectable({ providedIn: 'root' })
export class RideActions {
  private readonly workouts = inject(WORKOUT_API);

  async pause(): Promise<void> {
    try {
      await this.workouts.pause();
    } catch {
      /* toast in a later slice */
    }
  }

  async resume(): Promise<void> {
    try {
      await this.workouts.resume();
    } catch {
      /* toast in a later slice */
    }
  }

  end(event: Event): void {
    void event;
  }
}
