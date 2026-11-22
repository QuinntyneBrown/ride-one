import { HttpErrorResponse } from '@angular/common/http';
import {
  DestroyRef,
  Injectable,
  type Signal,
  type WritableSignal,
  inject,
  signal,
} from '@angular/core';
import { RIDES_API, type RideOutbox, type RideSyncState, type SubmitRideRequest } from '@telo/api';

/** The rides the outbox holds at once: a session's last few, never every ride of a long session. */
const HELD = 10;

const SENDING: RideSyncState = { kind: 'sending' };

interface Held {
  readonly ride: SubmitRideRequest;
  readonly state: WritableSignal<RideSyncState>;
}

/**
 * The finished rides of this session on their way to the backend (docs/detailed-designs/results/show-xp-stars-and-
 * personal-best), until L2-135 keeps them in browser storage. A ride is sent once for its ride id; one that never
 * reached the backend waits offline and is sent again when the browser is back online, while one the backend refused or
 * failed is not recorded. It holds the last ten rides, and its network listener goes with it.
 */
@Injectable()
export class SessionRideOutbox implements RideOutbox {
  private readonly rides = inject(RIDES_API);
  private readonly held = new Map<string, Held>();

  constructor() {
    const online = () => this.sendWaiting();
    window.addEventListener('online', online);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('online', online));
  }

  submit(ride: SubmitRideRequest): void {
    if (this.held.has(ride.rideId)) return;
    const entry: Held = { ride, state: signal(SENDING) };
    this.held.set(ride.rideId, entry);
    for (const oldest of [...this.held.keys()].slice(0, Math.max(0, this.held.size - HELD))) {
      this.held.delete(oldest);
    }
    this.send(entry);
  }

  status(rideId: string): Signal<RideSyncState> {
    return this.held.get(rideId)?.state.asReadonly() ?? signal(SENDING).asReadonly();
  }

  private send(entry: Held): void {
    entry.state.set(SENDING);
    this.rides.submitRide(entry.ride).subscribe({
      next: (answer) => entry.state.set({ kind: 'recorded', answer }),
      error: (error: unknown) =>
        entry.state.set(
          error instanceof HttpErrorResponse && error.status === 0
            ? { kind: 'waitingOffline' }
            : { kind: 'notRecorded' },
        ),
    });
  }

  private sendWaiting(): void {
    for (const entry of this.held.values()) {
      if (entry.state().kind === 'waitingOffline') this.send(entry);
    }
  }
}
