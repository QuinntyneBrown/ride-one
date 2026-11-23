import { Injectable } from '@angular/core';
import type { RideMusic } from '@telo/api';

/** The one track, served by the app's own origin (L2-176 AC2): Beautiful Boom Bap by Music_Unlimited. */
export const RIDE_MUSIC_PATH = 'music/beautiful-boom-bap.mp3';

/**
 * `RideMusic` on an `HTMLAudioElement` that loops (L2-176 AC1). The element is made, and the track fetched, by the
 * first `play`; a browser that refuses to play it leaves the ride as it is (AC7). `release` pauses the element, drops
 * its source so the browser lets go of the buffered track, and forgets it (AC6). The element keeps playing in a hidden
 * tab, as the ride's clock keeps running (AC8).
 */
@Injectable()
export class BrowserRideMusic implements RideMusic {
  private audio: HTMLAudioElement | null = null;

  play(): void {
    if (!this.audio) {
      this.audio = new Audio(RIDE_MUSIC_PATH);
      this.audio.loop = true;
    }
    this.audio.play().catch(() => undefined);
  }

  pause(): void {
    this.audio?.pause();
  }

  release(): void {
    const audio = this.audio;
    if (!audio) return;
    this.audio = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
  }
}
