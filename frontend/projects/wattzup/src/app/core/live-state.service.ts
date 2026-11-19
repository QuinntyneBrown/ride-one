// The one read-only live state every component reads (L2-044, L2-093). It owns no connection: the
// source bound to LIVE_STATE_SOURCE does (the event stream, or the in-browser bike).
import { Injectable, inject } from '@angular/core';
import { LIVE_STATE_SOURCE } from '@wattzup/api';

@Injectable({ providedIn: 'root' })
export class LiveStateService {
  private readonly source = inject(LIVE_STATE_SOURCE);

  readonly state = this.source.state;
  readonly connection = this.source.connection;
  readonly lastStateAt = this.source.lastStateAt;
  readonly loadFailed = this.source.loadFailed;
  readonly loadStatus = this.source.loadStatus;
  readonly streamEpoch = this.source.streamEpoch;

  /** Loads the state and starts delivering changes once; later calls do nothing. */
  ensureStarted(): void {
    this.source.ensureStarted();
  }

  /** Repeats the initial load (`Try again`). */
  reload(): void {
    this.source.reload();
  }

  /** Starts over, for example after the rider unlocks the server with a key. */
  restart(): void {
    this.source.restart();
  }

  /** Cancels the pending delay and reconnects at once (`Retry now`). */
  retryNow(): void {
    this.source.retryNow();
  }
}
