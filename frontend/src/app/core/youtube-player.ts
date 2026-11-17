// The contract every use of the YouTube player goes through (ADR 0012). The real player is
// IframeYouTubePlayer; tests reach a fake through the same contract.
import { InjectionToken, type Signal } from '@angular/core';

export type PlayerState = 'unstarted' | 'playing' | 'paused' | 'buffering' | 'ended';

/** One embedded player. */
export interface PlayerHandle {
  /** The player's state as YouTube reports it. */
  readonly state: Signal<PlayerState>;
  /** How many play calls in a row were not followed by `playing` (blocked autoplay). */
  readonly refused: Signal<number>;
  /** The last YouTube error code, or null. */
  readonly error: Signal<number | null>;
  seek(seconds: number): void;
  play(): void;
  pause(): void;
  currentTime(): number;
  title(): string;
  destroy(): void;
}

export interface YouTubePlayer {
  /** Builds a player for `videoId` inside `host`, cued at `startSeconds`. */
  create(host: HTMLElement, videoId: string, startSeconds: number): Promise<PlayerHandle>;
}

export const YOUTUBE_PLAYER = new InjectionToken<YouTubePlayer>('YOUTUBE_PLAYER');
