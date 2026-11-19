import type { BikeState, ClassEntry, WorkoutSnapshot } from '@wattzup/api';
import type { WorldRideSegment, WorldRideView } from '@wattzup/components';
import { formatDuration } from './format-duration';
import { formatDistance, formatLive, formatSpeed } from './metric-format';
import { powerDelta } from './power-delta';
import { controlsState, MAX_LEVEL } from './resistance-controls';
import { rideOverlayText } from './ride-overlay-text';
import { kindLabel, roundCount, toneOf } from './segment-labels';
import type { World } from './worlds';

/** What the World Ride HUD shows for a state, a class and its world (L2-091 to L2-097). */
export function worldRideView(state: BikeState, entry: ClassEntry, world: World): WorldRideView {
  return {
    title: world.name,
    classLine: `${world.route} · ${entry.title}`,
    bike: state.device_label,
    paused: state.workout?.status === 'paused',
    metrics: {
      power: formatLive(state.power),
      target: formatLive(state.target_power),
      delta: powerDelta(state.power, state.target_power, state.workout?.status ?? null),
      cadence: formatLive(state.cadence),
      // Heart rate is never read from the bike (ADR 0003).
      heart: '--',
      speed: formatSpeed(state.speed_kmh),
    },
    segment: state.workout ? segmentView(state.workout, world) : null,
    resistance: resistanceView(state),
    overlay: overlayView(state, world),
  };
}

/** `Work · 1 of 8`, and the next segment in the world's words (L2-093). */
function segmentView(workout: WorkoutSnapshot, world: World): WorldRideSegment | null {
  const { segments } = workout;
  const current = segments[workout.segment];
  if (!current) return null;
  const rounds = roundCount(segments);
  const label =
    current.kind === 'work' || current.kind === 'rest'
      ? `${kindLabel(current.kind)} · ${current.round} of ${rounds}`
      : kindLabel(current.kind);
  const next = segments[workout.segment + 1];
  return {
    label,
    tone: toneOf(current.kind),
    next: next
      ? `Next: ${next.kind === 'work' ? world.effortName : kindLabel(next.kind)} · ${formatDuration(next.duration)} at level ${next.level}`
      : 'Last stretch to the finish arch',
  };
}

/** − and + step the bike's level, only while it is connected (L2-096). */
function resistanceView(state: BikeState): WorldRideView['resistance'] {
  const controls = controlsState(state, state.ble === 'connected');
  return {
    level: formatLive(state.resistance),
    caption: state.workout?.mode === 'manual' ? 'Manual' : `Resistance / ${MAX_LEVEL}`,
    lowerDisabled: controls.lowerDisabled,
    raiseDisabled: controls.raiseDisabled,
  };
}

/** Paused, the lost bike, or the saved ride's end; none while riding (L2-097). */
function overlayView(state: BikeState, world: World): WorldRideView['overlay'] {
  const workout = state.workout;
  switch (workout?.status) {
    case 'paused':
      return {
        kind: 'paused',
        title: `Paused on ${world.route}`,
        text: 'The world holds still until you pedal again.',
        sessionHref: null,
      };
    case 'paused: bike disconnected':
      return {
        kind: 'lost',
        title: 'Lost the bike',
        text: `${state.device_label ?? 'Your bike'} stopped answering. You're parked at ${formatDistance(state.distance_km)} km on ${world.route}. Wake it with a pedal stroke, then reconnect.`,
        sessionHref: null,
      };
    case 'ended':
    case 'ended: bike shut off': {
      if (!workout.session_id) return null;
      const copy = rideOverlayText(
        workout.status === 'ended' ? 'ride-complete' : 'bike-shut-off',
        state,
      );
      return {
        kind: 'ended',
        title: copy.title,
        text: copy.lines.join(' '),
        sessionHref: `/sessions/${encodeURIComponent(workout.session_id)}`,
      };
    }
    default:
      return null;
  }
}
