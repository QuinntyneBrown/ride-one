// Sends resistance commands and Back to plan from the dashboard, and turns failures into
// danger toasts (L2-020, L2-047).
import { Injectable, inject } from '@angular/core';
import { BIKE_API, isContractError, WORKOUT_API } from '@wattzup/api';
import { ToastService } from './toast.service';

const TITLE = "Couldn't set resistance";

@Injectable({ providedIn: 'root' })
export class ResistanceCommandService {
  private readonly bike = inject(BIKE_API);
  private readonly workouts = inject(WORKOUT_API);
  private readonly toasts = inject(ToastService);

  async set(level: number): Promise<void> {
    try {
      await this.bike.setResistance(level);
    } catch (e) {
      if (isContractError(e, 'bike_not_connected')) {
        this.toasts.show({
          tone: 'danger',
          title: TITLE,
          text: "The bike isn't connected. Pedal to wake it, then try again.",
        });
        return;
      }
      const id = this.toasts.show({
        tone: 'danger',
        title: TITLE,
        text: `The bike didn't take it. Level ${level} was not set.`,
        action: {
          label: 'Retry',
          run: () => {
            this.toasts.dismiss(id);
            void this.set(level);
          },
        },
      });
    }
  }

  async backToPlan(): Promise<void> {
    try {
      await this.workouts.backToPlan();
    } catch {
      this.toasts.show({
        tone: 'danger',
        title: "Couldn't go back to the plan",
        text: 'Something went wrong. Try again.',
      });
    }
  }
}
