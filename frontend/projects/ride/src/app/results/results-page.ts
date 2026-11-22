import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { ClassResult, RaceResult } from '@telo/api';
import { Button, ResultsHeader, Standings } from '@telo/components';
import { type ResultsView, resultsView } from './results-view';

/** What a finished ride leaves in the navigation's state for Results. */
interface ResultsState {
  readonly raceResult?: RaceResult;
  readonly classResult?: ClassResult;
}

/**
 * Results (docs/mocks/pages/results/, L2-073, L2-078, L2-079): where the rider finished, the final standings and what to
 * ride next. The ride hands its result over in the navigation's history state, which a reload keeps, until the outbox
 * keeps finished rides (L2-135); with no result the rider goes Home. From lg it is two columns, the result and then
 * what was earned, with the actions at the bottom.
 */
@Component({
  selector: 'wz-results-page',
  imports: [RouterLink, Button, ResultsHeader, Standings],
  templateUrl: './results-page.html',
  styleUrl: './results-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ResultsPage {
  protected readonly view: ResultsView | null;

  constructor() {
    const state = (inject(Location).getState() ?? {}) as ResultsState;
    const result = state.raceResult ?? state.classResult ?? null;
    this.view = result === null ? null : resultsView(result);
    if (result === null) void inject(Router).navigateByUrl('/', { replaceUrl: true });
  }
}
