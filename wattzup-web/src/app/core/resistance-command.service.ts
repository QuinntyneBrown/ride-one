// Sends resistance commands and Back to plan from the dashboard, and turns failures into
// danger toasts (L2-020, L2-047).
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BIKE_API, RequestTimeoutError } from './bike-api';
import { ToastService } from './toast.service';
import { WORKOUT_API } from './workout-api';

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
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      if (e instanceof HttpErrorResponse && e.status === 503) {
        this.toasts.show({
          tone: 'danger',
          title: TITLE,
          text: "The bike isn't connected. Pedal to wake it, then try again.",
        });
        return;
      }
      const text =
        e instanceof RequestTimeoutError
          ? `The server didn't answer (timeout after 5 s). Level ${level} was not sent.`
          : `The Wattzup server didn't answer. Level ${level} was not sent.`;
      const id = this.toasts.show({
        tone: 'danger',
        title: TITLE,
        text,
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
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      this.toasts.show({
        tone: 'danger',
        title: "Couldn't go back to the plan",
        text: "The Wattzup server didn't answer. Try again.",
      });
    }
  }
}
