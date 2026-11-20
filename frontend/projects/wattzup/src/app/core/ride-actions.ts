// The ride commands: Pause, Resume, End and Reconnect (L2-046, L2-051, L2-058).
import { Injectable, inject, signal } from '@angular/core';
import { BIKE_API, isContractError, WORKOUT_API } from '@wattzup/api';
import { DialogLauncher } from './dialog-launcher';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class RideActions {
  private readonly workouts = inject(WORKOUT_API);
  private readonly toasts = inject(ToastService);
  private readonly bike = inject(BIKE_API);
  private readonly dialogs = inject(DialogLauncher);
  private readonly _reconnecting = signal(false);
  readonly reconnecting = this._reconnecting.asReadonly();

  pause(): Promise<void> {
    return this.run(() => this.workouts.pause(), "Couldn't pause the ride");
  }

  resume(): Promise<void> {
    return this.run(() => this.workouts.resume(), "Couldn't resume the ride");
  }

  /** `Reconnect` on the lost-bike overlay (L2-058 AC5, L2-004). */
  async reconnect(): Promise<void> {
    this._reconnecting.set(true);
    try {
      await this.bike.reconnect();
    } catch (e) {
      if (!isContractError(e, 'already_connected')) {
        this.toasts.show({
          tone: 'danger',
          title: "Couldn't reconnect",
          text: "The bike didn't answer. Wake it with a pedal stroke, then try again.",
        });
      }
    } finally {
      this._reconnecting.set(false);
    }
  }

  end(): void {
    void this.dialogs.openEndRide();
  }

  private async run(request: () => Promise<void>, title: string): Promise<void> {
    try {
      await request();
    } catch {
      this.toasts.show({
        tone: 'danger',
        title,
        text: 'Something went wrong. Try again.',
      });
    }
  }
}
