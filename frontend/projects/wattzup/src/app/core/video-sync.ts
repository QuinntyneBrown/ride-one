// The ride-along video's sync rules (L2-076 criteria 3, 4 and 10, ADR 0012): the video follows the
// ride, never the other way round, except for the rider's own pause and play (see VideoSync).
import type { RideVideo, WorkoutStatus } from '@wattzup/api';
import type { PlayerState } from './youtube-player';

export type SyncAction = 'play-at' | 'pause-at' | 'seek' | 'none';

/** The drift, in seconds, the video may show before it is moved back to the target. */
export const DRIFT_SECONDS = 1.5;

/** Where the video should be: the start point plus the ride's elapsed time. */
export function targetPosition(video: RideVideo, workout: { elapsed_seconds: number }): number {
  return Math.round((video.start_seconds + workout.elapsed_seconds) * 10) / 10;
}

export interface SyncInput {
  status: WorkoutStatus;
  player: PlayerState;
  position: number;
  target: number;
  /** Whether the page is shown; a hidden page leaves the player alone. */
  visible: boolean;
  /** The page was just shown again: seek to the target before anything else. */
  resync: boolean;
}

/**
 * What the sync does to the player. While `running`, it plays at the target, or seeks back after
 * drift over 1.5 s; for every other status it pauses at the target. An `ended` video (a start
 * point past its end) is left alone.
 */
export function syncAction(i: SyncInput): SyncAction {
  if (!i.visible || i.player === 'ended') return 'none';
  const drifted = i.resync || Math.abs(i.position - i.target) > DRIFT_SECONDS;
  if (i.status === 'running') {
    if (i.player === 'playing' || i.player === 'buffering') return drifted ? 'seek' : 'none';
    return 'play-at';
  }
  if (i.player === 'playing' || i.player === 'buffering') return 'pause-at';
  return drifted ? 'seek' : 'none';
}

export type RiderAction = 'pause-ride' | 'resume-ride' | 'none';

/**
 * What the rider's own pause or play inside the player does to the ride: a pause while `running`
 * pauses the ride, a play while `paused` resumes it. A change the sync made is never the rider's
 * (L2-076 criterion 5).
 */
export function riderAction(
  status: WorkoutStatus,
  player: PlayerState,
  cause: 'rider' | 'sync',
): RiderAction {
  if (cause === 'sync') return 'none';
  if (status === 'running' && player === 'paused') return 'pause-ride';
  if (status === 'paused' && player === 'playing') return 'resume-ride';
  return 'none';
}

/** Playback counts as blocked at 2 refused play calls in a row (L2-076 criterion 6). */
export function isBlocked(refusals: number): boolean {
  return refusals >= 2;
}
