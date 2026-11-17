// Sends a stepped speed or incline from the dashboard and turns failures into danger toasts
// (L2-071 criterion 7). The reported and target values come back over the event stream.
import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { RequestTimeoutError, MACHINE_API } from '@wattzup/api';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class TreadmillCommandService {
  private readonly machine = inject(MACHINE_API);
  private readonly toasts = inject(ToastService);

  setSpeed(speed: number): Promise<void> {
    return this.send(
      () => this.machine.setSpeed(speed),
      "Couldn't set speed",
      `Speed ${speed.toFixed(1)} km/h was not sent.`,
    );
  }

  setIncline(incline: number): Promise<void> {
    return this.send(
      () => this.machine.setIncline(incline),
      "Couldn't set incline",
      `Incline ${incline} % was not sent.`,
    );
  }

  private async send(request: () => Promise<void>, title: string, notSent: string): Promise<void> {
    try {
      await request();
    } catch (e) {
      if (e instanceof HttpErrorResponse && e.status === 401) return;
      const text =
        e instanceof HttpErrorResponse && e.status === 503
          ? "The treadmill isn't connected. Switch it on, then try again."
          : e instanceof RequestTimeoutError
            ? `The server didn't answer (timeout after 5 s). ${notSent}`
            : `The Wattzup server didn't answer. ${notSent}`;
      this.toasts.show({ tone: 'danger', title, text });
    }
  }
}
