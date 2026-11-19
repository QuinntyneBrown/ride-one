import type { BikeState, ClassEntry } from '@wattzup/api';
import type { WorldRideView } from '@wattzup/components';
import type { World } from './worlds';

/** What the World Ride HUD shows for a state, a class and its world (L2-091 to L2-097). */
export function worldRideView(state: BikeState, entry: ClassEntry, world: World): WorldRideView {
  return {
    title: world.name,
    classLine: `${world.route} · ${entry.title}`,
    bike: state.device_label,
    paused: state.workout?.status === 'paused',
  };
}
