// Whether the device has a network connection, from navigator.onLine and the window's `online`
// and `offline` events. The class page uses it to say when its video cannot play (L2-098 AC1).
import { DestroyRef, inject, Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OnlineStatus {
  private readonly _online = signal(navigator.onLine);
  readonly online = this._online.asReadonly();

  constructor() {
    const online = () => this._online.set(true);
    const offline = () => this._online.set(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    });
  }
}
