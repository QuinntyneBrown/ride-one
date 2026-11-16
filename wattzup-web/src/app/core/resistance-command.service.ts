// Sends resistance commands and Back to plan from the dashboard (L2-020, L2-047).
import { Injectable, inject } from '@angular/core';
import { BIKE_API } from './bike-api';
import { WORKOUT_API } from './workout-api';

@Injectable({ providedIn: 'root' })
export class ResistanceCommandService {
  private readonly bike = inject(BIKE_API);
  private readonly workouts = inject(WORKOUT_API);

  async set(level: number): Promise<void> {
    try {
      await this.bike.setResistance(level);
    } catch {
      /* failure toasts follow in the command feedback slice */
    }
  }

  async backToPlan(): Promise<void> {
    try {
      await this.workouts.backToPlan();
    } catch {
      /* failure toasts follow in the command feedback slice */
    }
  }
}
