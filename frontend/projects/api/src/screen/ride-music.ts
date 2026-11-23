import type { Signal } from '@angular/core';
import { InjectionToken } from '@angular/core';

/**
 * The ride's music (L2-176): one track, played in the background of a ride in Ibiza and nowhere else. Nothing is
 * fetched until `play` is first called while the music is on, which is when the ride starts.
 */
export interface RideMusic {
  /** Whether the rider wants the music: kept on this device, on until turned off (L2-176 AC5). */
  readonly on: Signal<boolean>;
  /** False once the track could not be loaded or the browser refused to play it (L2-176 AC7). */
  readonly available: Signal<boolean>;
  /** Turns the music off or on, and keeps the setting for the next ride. */
  toggle(): void;
  /** Plays the track from where it was, looping, if the music is on; the first call fetches it. */
  play(): void;
  /** Holds the track where it is. */
  pause(): void;
  /** Stops the track and lets go of its element and buffers. */
  release(): void;
}

export const RIDE_MUSIC = new InjectionToken<RideMusic>('RIDE_MUSIC');
