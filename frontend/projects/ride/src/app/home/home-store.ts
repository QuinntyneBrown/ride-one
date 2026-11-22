import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CURRENT_RIDER, MAPS_API, PROGRESS_STORE } from '@telo/api';
import { catchError, of } from 'rxjs';
import { homeGreeting } from './home-greeting';
import { nextRideView } from './next-ride-view';
import { raceDoorView } from './race-door-view';

/**
 * Home's state, provided on its page (docs/detailed-designs/home/choose-the-next-ride): the rider's progress, shared
 * with the header, joined with the map catalogue. The greeting follows the hour Home opened at; the Next ride card and
 * the Race door wait for both the progress and the catalogue, and are absent while either cannot be read.
 */
@Injectable()
export class HomeStore {
  private readonly progress = inject(PROGRESS_STORE).progress;
  private readonly rider = inject(CURRENT_RIDER).rider;
  private readonly maps = toSignal(
    inject(MAPS_API)
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

  readonly nextRide = computed(() => {
    const progress = this.progress();
    const maps = this.maps();
    return progress && maps ? nextRideView(progress, maps) : null;
  });

  readonly raceDoor = computed(() => {
    const progress = this.progress();
    const maps = this.maps();
    return progress && maps ? raceDoorView(progress, maps) : null;
  });
}
