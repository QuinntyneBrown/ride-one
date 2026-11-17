// Keeps PowerTraceHistory in step with the stream and the trace endpoint (L2-026, L2-050).
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import type { BikeState } from '@wattzup/api';
import { LiveStateService } from './live-state.service';
import { PowerTraceHistory } from './power-trace-history';
import { WORKOUT_API } from '@wattzup/api';

@Injectable({ providedIn: 'root' })
export class PowerTraceStore {
  private readonly live = inject(LiveStateService);
  private readonly workouts = inject(WORKOUT_API);
  readonly history = new PowerTraceHistory();
  private readonly _version = signal(0);
  /** Bumps whenever the history changes, so the trace redraws. */
  readonly version = this._version.asReadonly();

  private hadWorkout = false;
  private epoch = -1;
  private loading = false;
  private pendingReload = false;

  constructor() {
    effect(() => {
      const state = this.live.state();
      const epoch = this.live.streamEpoch();
      untracked(() => this.observe(state, epoch));
    });
  }

  private observe(state: BikeState | null, epoch: number): void {
    const w = state?.workout ?? null;
    if (!w) {
      if (this.hadWorkout || this.history.length) {
        this.history.clear();
        this.bump();
      }
      this.hadWorkout = false;
      return;
    }
    const reconnected = epoch !== this.epoch;
    this.epoch = epoch;
    if (!this.hadWorkout || reconnected) {
      this.hadWorkout = true;
      void this.reload();
      return;
    }
    if (w.status !== 'running' || this.loading) return;
    const result = this.history.append(Math.floor(w.elapsed_seconds), state?.power ?? null);
    if (result === 'appended') this.bump();
    else if (result === 'gap' || result === 'restart') {
      if (result === 'restart') this.history.clear();
      void this.reload();
    }
  }

  private async reload(): Promise<void> {
    if (this.loading) {
      this.pendingReload = true;
      return;
    }
    this.loading = true;
    try {
      const trace = await this.workouts.trace();
      this.history.restore(trace.samples);
    } catch {
      /* keep what we have; the next reconnect reloads */
    } finally {
      this.loading = false;
      this.bump();
    }
    if (this.pendingReload) {
      this.pendingReload = false;
      void this.reload();
    }
  }

  private bump(): void {
    this._version.update((v) => v + 1);
  }
}
