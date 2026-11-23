/** Why a class ride stands still: the rider paused it, the bike stopped answering, both, or neither. */
export interface RideHoldReasons {
  /** The rider pressed Pause and has not pressed Resume (L2-091). */
  readonly pausedByRider: boolean;
  /** The bike has stopped answering and is not back (L2-092). */
  readonly bikeLost: boolean;
}

/** What Class Ride does and shows in one of the four states a ride can be in. */
export interface RideHold {
  /** Whether the clock, the plan and the video (or the course) run. */
  readonly running: boolean;
  /** The header button's word: "Pause" while the ride runs, "Resume" while it is held. */
  readonly action: 'Pause' | 'Resume';
  /** Whether that button is disabled: only the bike coming back ends a hold for a lost bike. */
  readonly actionDisabled: boolean;
  /** Whether "Paused" is drawn over the video or the course: the rider's own pause. */
  readonly pausedOverlay: boolean;
  /** Whether the "Lost the bike" alert shows, with Reconnect. */
  readonly lostAlert: boolean;
}

/**
 * The state of a class ride from the two reasons it can be held (L2-091 AC1, L2-092 AC1, AC2, AC4;
 * docs/mocks/pages/class-ride/default, paused and disconnected). The ride runs only with neither; a lost bike turns
 * Resume off and shows the alert, which says the ride is paused, so "Paused" is drawn for the rider's own pause
 * alone; and a ride the rider paused stays paused when the bike is back.
 */
export function rideHold({ pausedByRider, bikeLost }: RideHoldReasons): RideHold {
  const running = !pausedByRider && !bikeLost;
  return {
    running,
    action: running ? 'Pause' : 'Resume',
    actionDisabled: bikeLost,
    pausedOverlay: pausedByRider,
    lostAlert: bikeLost,
  };
}

/** What the lost-bike alert says the ride is doing meanwhile: the video with the class video, the ride in Ibiza (L2-092 AC1). */
export function lostBikeMessage(ridingIn: 'video' | 'ibiza'): string {
  return ridingIn === 'ibiza'
    ? 'The ride is paused. Pedal to wake the bike, then reconnect.'
    : 'The video is paused. Pedal to wake the bike, then reconnect.';
}

/** What a screen reader hears when the rider pauses or resumes the ride, once for each change (L2-091 AC3). */
export function pauseAnnouncement(paused: boolean): string {
  return paused ? 'Ride paused' : 'Ride resumed';
}
