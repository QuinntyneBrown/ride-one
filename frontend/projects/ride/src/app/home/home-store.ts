import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CLASSES_API } from '@telo/api';
import { catchError, of } from 'rxjs';
import { classDoorView } from './class-door-view';
import { homeGreeting } from './home-greeting';

/**
 * Home's state, provided on its page (docs/detailed-designs/home/choose-the-next-ride): the class catalogue, and the
 * greeting, which follows the hour Home opened at. Telo Ride 1 knows no rider's name or progress (ADR 0039).
 */
@Injectable()
export class HomeStore {
  private readonly classes = toSignal(
    inject(CLASSES_API)
      .list()
      .pipe(catchError(() => of(null))),
    { initialValue: null },
  );
  private readonly hour = new Date().getHours();

  readonly greeting = homeGreeting(this.hour);

  /** The Classes door waits only for the catalogue (L2-035). */
  readonly classDoor = computed(() => {
    const classes = this.classes();
    return classes ? classDoorView(classes) : null;
  });
}
