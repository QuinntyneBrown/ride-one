// Whether World Ride plays its music: on unless the rider turns it off, kept in this browser
// (L2-128 AC5).
import { Injectable, signal } from '@angular/core';
import { SafeStorage } from '@wattzup/api';

export const MUSIC_KEY = 'wattzup.music';

@Injectable({ providedIn: 'root' })
export class MusicPreference {
  private readonly storage = new SafeStorage(() => localStorage);
  private readonly _on = signal(this.storage.get(MUSIC_KEY) !== 'off');
  readonly on = this._on.asReadonly();

  toggle(): void {
    this._on.set(!this._on());
    this.storage.set(MUSIC_KEY, this._on() ? 'on' : 'off');
  }
}
