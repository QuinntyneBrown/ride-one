// Keeps TreadmillTraceHistory in step with the stream (L2-071 criterion 6).
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import type { BikeState } from '@wattzup/api';
import { LiveStateService } from './live-state.service';
import { TreadmillTraceHistory } from './treadmill-trace-history';

@Injectable({ providedIn: 'root' })
export class TreadmillTraceStore {
  private readonly live = inject(LiveStateService);
  readonly history = new TreadmillTraceHistory();
  private readonly _version = signal(0);
  /** Bumps whenever the history changes, so the trace redraws. */
  readonly version = this._version.asReadonly();

  constructor() {
    effect(() => {
      const state = this.live.state();
      untracked(() => this.observe(state));
    });
  }

  private observe(state: BikeState | null): void {
    const w = state?.workout ?? null;
    if (!w || state?.machine !== 'treadmill') {
      if (this.history.length) {
        this.history.clear();
        this.bump();
      }
      return;
    }
    if (w.status !== 'running') return;
    if (this.history.append(Math.floor(w.elapsed_seconds), state.speed_kmh, state.incline)) {
      this.bump();
    }
  }

  private bump(): void {
    this._version.update((v) => v + 1);
  }
}
