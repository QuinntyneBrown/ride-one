import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CLASSES_API, CURRENT_RIDER, PROGRESS_STORE } from '@telo/api';
import { catchError, of } from 'rxjs';
import { classDoorView } from './class-door-view';
import { homeGreeting } from './home-greeting';

/**
 * Home's state, provided on its page (docs/detailed-designs/home/choose-the-next-ride): the rider's progress, shared
 * with the header, joined with the class catalogue. The greeting follows the hour Home opened at.
 */
@Injectable()
export class HomeStore {
  private readonly progress = inject(PROGRESS_STORE).progress;
  private readonly rider = inject(CURRENT_RIDER).rider;
  private readonly classes = toSignal(
    inject(CLASSES_API)
      .list()
      .pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly hour = new Date().getHours();

  /** A new rider has no XP yet (L2-033 AC3). */
  readonly isNewRider = computed(() => this.progress()?.totalXp === 0);

  readonly greeting = computed(() =>
    homeGreeting(this.rider()?.displayName ?? null, this.hour, this.isNewRider()),
  );

  /** The Classes door waits only for the catalogue: its featured class opens at level 1 (L2-035). */
  readonly classDoor = computed(() => {
    const classes = this.classes();
    return classes ? classDoorView(classes, this.progress()?.level ?? 1) : null;
  });
}
