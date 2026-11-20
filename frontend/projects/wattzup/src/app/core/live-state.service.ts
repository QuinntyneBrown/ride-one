// The one read-only live state every component reads (L2-044, L2-093). It owns no connection: the
// source bound to LIVE_STATE_SOURCE (the in-browser bike) does.
import { Injectable, inject } from '@angular/core';
import { LIVE_STATE_SOURCE } from '@wattzup/api';

@Injectable({ providedIn: 'root' })
export class LiveStateService {
  private readonly source = inject(LIVE_STATE_SOURCE);

  readonly state = this.source.state;
  readonly lastStateAt = this.source.lastStateAt;

  /** Starts delivering the state once; later calls do nothing. */
  ensureStarted(): void {
    this.source.ensureStarted();
  }
}
