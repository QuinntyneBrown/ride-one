import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  ANNOUNCER,
  type ClassResult,
  RIDE_OUTBOX,
  type RideSyncState,
  type SubmitRideRequest,
} from '@telo/api';
import { Button, ResultsHeader, XpEarned } from '@telo/components';
import { type ResultsView, resultsView } from './results-view';
import { FullscreenButton } from '../fullscreen/fullscreen-button';

/** What a finished ride leaves in the navigation's state for Results: its result and the ride as it was submitted. */
interface ResultsState {
  readonly classResult?: ClassResult;
  readonly ride?: SubmitRideRequest;
}

const SENDING = signal<RideSyncState>({ kind: 'sending' }).asReadonly();

/**
 * Results (docs/mocks/pages/results/, L2-073 to L2-079): the finished class, what the ride
 * earned and what to ride next. The ride hands its result and the ride itself over in the navigation's history state,
 * which a reload keeps; with no result the rider goes Home. Results submits the ride to the outbox too, which keeps it
 * on the device until the backend has it (L2-135) and sends a ride id once: after a reload the backend answers the
 * repeat as it answered the first time. From lg it is two columns, the result and then what was earned, with the actions below.
 */
@Component({
  selector: 'wz-results-page',
  imports: [FullscreenButton, RouterLink, Button, ResultsHeader, XpEarned],
  templateUrl: './results-page.html',
  styleUrl: './results-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResultsPage {
  protected readonly view: () => ResultsView | null;

  constructor() {
    const state = (inject(Location).getState() ?? {}) as ResultsState;
    const result = state.classResult ?? null;
    const outbox = inject(RIDE_OUTBOX);
    if (state.ride) outbox.submit(state.ride);
    const sync = state.ride ? outbox.status(state.ride.rideId) : SENDING;
    this.view = computed(() => (result === null ? null : resultsView(result, sync())));
    // The result, said as Results opens, and again once the XP is recorded (L2-141 AC2).
    const announcer = inject(ANNOUNCER);
    const announcement = computed(() => this.view()?.announcement ?? null);
    effect(() => {
      const heard = announcement();
      if (heard !== null) announcer.announce(heard);
    });
    if (result === null) void inject(Router).navigateByUrl('/', { replaceUrl: true });
  }
}
