// Which skeleton, overlay or error the ride dashboard shows, and which controls work (L2-058,
// L2-071 criteria 8 and 9).
import type { BikeState, StreamConnection } from '@wattzup/api';
import { isActive } from './workout-status';

export type RideView = 'loading' | 'load-failed' | 'ride';
export type RideOverlayKind =
  | 'scanning'
  | 'adapter-off'
  | 'bike-lost'
  | 'bike-shut-off'
  | 'belt-countdown'
  | 'belt-starting'
  | 'belt-stopped';

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
  else if (state.belt_countdown !== null) overlay = 'belt-countdown';
  else if (status === 'starting belt') overlay = 'belt-starting';
  else if (status === 'paused: belt stopped') overlay = 'belt-stopped';
  else if (state.ble === 'scanning') overlay = 'scanning';

  const connected = state.ble === 'connected';
  const active = isActive(state.workout);
  return {
    view: 'ride',
    overlay,
    dimmed: overlay === 'bike-lost' || offline,
    commandsEnabled: !offline && connected,
    // The treadmill can't pause mid-countdown or while it is not connected (L2-071 criterion 1).
    pauseEnabled:
      !offline &&
      active &&
      (state.machine !== 'treadmill' ||
        (connected && status !== 'starting belt' && state.belt_countdown === null)),
    endEnabled: active,
    controlsNote: connected
      ? null
      : state.machine === 'treadmill'
        ? 'Speed and incline controls wake up once the treadmill connects.'
        : 'Resistance controls wake up once the bike connects.',
  };
}
