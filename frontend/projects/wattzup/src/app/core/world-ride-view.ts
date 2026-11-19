import type { BikeState, ClassEntry, WorkoutSnapshot } from '@wattzup/api';
import type { WorldRideSegment, WorldRideView } from '@wattzup/components';
import { formatDuration } from './format-duration';
import { formatLive, formatSpeed } from './metric-format';
import { powerDelta } from './power-delta';
import { controlsState, MAX_LEVEL } from './resistance-controls';
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
