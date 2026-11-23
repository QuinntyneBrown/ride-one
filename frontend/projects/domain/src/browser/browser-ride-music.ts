import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import type { RideMusic } from '@telo/api';

/** The one track, served by the app's own origin (L2-176 AC2): Beautiful Boom Bap by Music_Unlimited. */
export const RIDE_MUSIC_PATH = 'music/beautiful-boom-bap.mp3';

/** Where the setting lives in localStorage: only "off" is written, since on is how a rider starts. */
export const RIDE_MUSIC_KEY = 'telo-ride.music';

/**
 * `RideMusic` on an `HTMLAudioElement` that loops (L2-176 AC1). The element is made, and the track fetched, by the
 * first `play` while the music is on; a track that cannot be loaded, or a browser that refuses to play it, makes the
 * music unavailable and leaves the ride as it is (AC7). The setting is kept in localStorage (AC5). `release` pauses
 * the element, drops its source so the browser lets go of the buffered track, and forgets it (AC6). The element
 * keeps playing in a hidden tab, as the ride's clock keeps running (AC8).
 */
@Injectable()
export class BrowserRideMusic implements RideMusic {
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly isOn = signal(this.read());
  private readonly isAvailable = signal(true);
  private audio: HTMLAudioElement | null = null;

  readonly on = this.isOn.asReadonly();
  readonly available = this.isAvailable.asReadonly();

  toggle(): void {
    const on = !this.isOn();
    this.isOn.set(on);
    this.keep(on);
  }

  play(): void {
    if (!this.isOn() || !this.isAvailable()) return;
    if (!this.audio) {
      const audio = new Audio(RIDE_MUSIC_PATH);
      audio.loop = true;
      audio.addEventListener('error', () => this.isAvailable.set(false));
      this.audio = audio;
    }
    this.audio.play().catch(() => this.isAvailable.set(false));
  }

  pause(): void {
    this.audio?.pause();
  }

  release(): void {
    const audio = this.audio;
    if (!audio) return;
    this.audio = null;
    // The next ride tries the track again.
    this.isAvailable.set(true);
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }

  private read(): boolean {
    try {
      return this.window?.localStorage.getItem(RIDE_MUSIC_KEY) !== 'off';
    } catch {
      return true;
    }
  }

  private keep(on: boolean): void {
    try {
      if (on) this.window?.localStorage.removeItem(RIDE_MUSIC_KEY);
      else this.window?.localStorage.setItem(RIDE_MUSIC_KEY, 'off');
    } catch {
      // Storage refused (private mode, quota): the setting lasts for this visit.
    }
  }
}
