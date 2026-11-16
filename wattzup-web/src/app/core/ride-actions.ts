// The app bar's ride commands: Pause, Resume and End (L2-046, L2-051).
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ToastService } from './toast.service';
import { WORKOUT_API } from './workout-api';

@Injectable({ providedIn: 'root' })
export class RideActions {
  private readonly workouts = inject(WORKOUT_API);
  private readonly toasts = inject(ToastService);

  pause(): Promise<void> {
    return this.run(() => this.workouts.pause(), "Couldn't pause the ride");
  }

  resume(): Promise<void> {
    return this.run(() => this.workouts.resume(), "Couldn't resume the ride");
  }

  end(event: Event): void {
    void event;
  }

  private async run(request: () => Promise<void>, title: string): Promise<void> {
    try {
      await request();
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      this.toasts.show({
        tone: 'danger',
        title,
        text: "The Wattzup server didn't answer. Try again.",
      });
    }
  }
}
