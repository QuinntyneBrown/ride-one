import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ANNOUNCER, type ClassResult } from '@telo/api';
import { Button, ClassDone } from '@telo/components';
import { type ClassDoneView, classDoneView } from './class-done-view';
import { FullscreenButton } from '../fullscreen/fullscreen-button';

/** What a finished ride leaves in the navigation's state for Class Done: its result. */
interface ClassDoneState {
  readonly classResult?: ClassResult;
}

/**
 * Class Done (docs/mocks/pages/class-done/, L2-078, L2-079): the finished class's output, time and average. The ride
 * hands its result over in the navigation's history state, which a reload keeps; with none, The Class opens instead
 * (AC5). Done leads to The Class. The ride is sent nowhere and earns nothing (ADR 0039).
 */
@Component({
  selector: 'wz-class-done-page',
  imports: [ClassDone, FullscreenButton, RouterLink, Button],
  templateUrl: './class-done-page.html',
  styleUrl: './class-done-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ClassDonePage {
  protected readonly view: ClassDoneView | null;

  constructor() {
    const state = (inject(Location).getState() ?? {}) as ClassDoneState;
    const result = state.classResult ?? null;
    this.view = result === null ? null : classDoneView(result);
    // The result, said as Class Done opens (L2-141 AC2).
    if (this.view !== null) inject(ANNOUNCER).announce(this.view.announcement);
    if (result === null) void inject(Router).navigateByUrl('/', { replaceUrl: true });
  }
}
