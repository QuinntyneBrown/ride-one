import { InjectionToken } from '@angular/core';

/**
 * The ride's music (L2-176): one track, played in the background of a ride in Ibiza and nowhere else. Nothing is
 * fetched until `play` is first called, which is when the ride starts.
 */
export interface RideMusic {
  /** Plays the track from where it was, looping; the first call fetches it. Does nothing if the browser refuses. */
  play(): void;
  /** Holds the track where it is. */
  pause(): void;
  /** Stops the track and lets go of its element and buffers. */
  release(): void;
}

export const RIDE_MUSIC = new InjectionToken<RideMusic>('RIDE_MUSIC');
