import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ANNOUNCER, type ClassResult } from '@telo/api';
import { Button, ResultsHeader } from '@telo/components';
import { type ResultsView, resultsView } from './results-view';
import { FullscreenButton } from '../fullscreen/fullscreen-button';

/** What a finished ride leaves in the navigation's state for Results: its result. */
interface ResultsState {
  readonly classResult?: ClassResult;
}

/**
 * Results (docs/mocks/pages/results/, L2-078, L2-079): the finished class and what to ride next. The ride hands its
 * result over in the navigation's history state, which a reload keeps; with no result the rider goes Home. The ride is
 * sent nowhere and earns nothing: Telo Ride 1 has no account (ADR 0039), and Class Done replaces this screen (32.2).
 * From lg it is two columns, the result and then the actions.
 */
@Component({
  selector: 'wz-results-page',
  imports: [FullscreenButton, RouterLink, Button, ResultsHeader],
  templateUrl: './results-page.html',
  styleUrl: './results-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResultsPage {
  protected readonly view: ResultsView | null;

  constructor() {
    const state = (inject(Location).getState() ?? {}) as ResultsState;
    const result = state.classResult ?? null;
    this.view = result === null ? null : resultsView(result);
    // The result, said as Results opens (L2-141 AC2).
    if (this.view !== null) inject(ANNOUNCER).announce(this.view.announcement);
    if (result === null) void inject(Router).navigateByUrl('/', { replaceUrl: true });
  }
}
