// Which skeleton, overlay or error the ride dashboard shows, and which controls work (L2-058).
import type { BikeState } from './api-types';
import type { StreamConnection } from './stream-connection';
import { isActive } from './workout-status';

export type RideView = 'loading' | 'load-failed' | 'ride';
export type RideOverlayKind = 'scanning' | 'adapter-off' | 'bike-lost' | 'bike-shut-off';

export interface RideViewState {
  view: RideView;
  overlay: RideOverlayKind | null;
  dimmed: boolean;
  commandsEnabled: boolean;
  pauseEnabled: boolean;
  endEnabled: boolean;
  controlsNote: string | null;
}

export function rideViewState(
  state: BikeState | null,
  connection: StreamConnection,
  loadFailed: boolean,
): RideViewState {
  const offline = connection === 'offline';
  if (loadFailed) {
    return {
      view: 'load-failed',
      overlay: null,
      dimmed: false,
      commandsEnabled: false,
      pauseEnabled: false,
      endEnabled: false,
      controlsNote: 'Controls return when Wattzup can read the bike again.',
    };
  }
  if (!state) {
    return {
      view: 'loading',
      overlay: null,
      dimmed: false,
      commandsEnabled: false,
      pauseEnabled: false,
      endEnabled: false,
      controlsNote: null,
    };
  }
  const status = state.workout?.status;
  let overlay: RideOverlayKind | null = null;
  if (state.adapter === 'off') overlay = 'adapter-off';
  else if (status === 'ended: bike shut off') overlay = 'bike-shut-off';
  else if (status === 'paused: bike disconnected') overlay = 'bike-lost';
  else if (state.ble === 'scanning') overlay = 'scanning';

  const connected = state.ble === 'connected';
  const active = isActive(state.workout);
  return {
    view: 'ride',
    overlay,
    dimmed: overlay === 'bike-lost' || offline,
    commandsEnabled: !offline && connected,
    pauseEnabled: !offline && active,
    endEnabled: active,
    controlsNote: connected ? null : 'Resistance controls wake up once the bike connects.',
  };
}
