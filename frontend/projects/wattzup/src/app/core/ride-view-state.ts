// Which skeleton, overlay or error the ride dashboard shows, and which controls work (L2-058).
import type { BikeState, BluetoothSupport } from '@wattzup/api';
import { isActive } from './workout-status';

export type RideView = 'loading' | 'ride';
export type RideOverlayKind =
  | 'browser-unsupported'
  | 'browser-insecure'
  | 'connect-bike'
  | 'scanning'
  | 'adapter-off'
  | 'bike-lost'
  | 'bike-shut-off'
  | 'ride-complete';

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
  /** No bike chosen yet (L2-090 AC1). */
  pairingRequired = false,
  /** The page cannot reach Bluetooth (L2-089 AC1, AC3). */
  support: BluetoothSupport = 'ready',
): RideViewState {
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
  if (support === 'unsupported') overlay = 'browser-unsupported';
  else if (support === 'insecure') overlay = 'browser-insecure';
  else if (state.adapter === 'off') overlay = 'adapter-off';
  else if (pairingRequired) overlay = 'connect-bike';
  else if (status === 'ended: bike shut off') overlay = 'bike-shut-off';
  // A plan ridden to its end and saved leads to its summary (L2-084 AC3).
  else if (status === 'ended' && state.workout?.session_id) overlay = 'ride-complete';
  else if (status === 'paused: bike disconnected') overlay = 'bike-lost';
  else if (state.ble === 'scanning') overlay = 'scanning';

  const connected = state.ble === 'connected';
  const active = isActive(state.workout);
  return {
    view: 'ride',
    overlay,
    dimmed: overlay === 'bike-lost',
    commandsEnabled: connected,
    pauseEnabled: active,
    endEnabled: active,
    controlsNote: connected ? null : 'Resistance controls wake up once the bike connects.',
  };
}
