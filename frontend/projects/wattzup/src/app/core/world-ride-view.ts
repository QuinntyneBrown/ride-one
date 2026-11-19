import type { BikeState, ClassEntry } from '@wattzup/api';
import type { WorldRideView } from '@wattzup/components';
import { formatLive, formatSpeed } from './metric-format';
import { powerDelta } from './power-delta';
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
  };
}
