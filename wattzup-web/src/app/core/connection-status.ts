// The app bar's status line (L2-018). First matching row wins.
import type { BikeState } from './api-types';
import type { StreamConnection } from './stream-connection';

export type StatusIcon = 'bluetooth' | 'bluetooth-scan' | 'bluetooth-off' | 'wifi-off';
export type StatusTone = 'ok' | 'wait' | 'bad';

export interface ConnectionStatus {
  name: string;
  label: string;
  icon: StatusIcon;
  tone: StatusTone;
}

export function connectionStatus(
  state: BikeState | null,
  connection: StreamConnection,
  loadFailed: boolean,
): ConnectionStatus {
  if (connection === 'offline') {
    return { name: 'Server offline', label: 'Retrying…', icon: 'wifi-off', tone: 'bad' };
  }
  if (!state || loadFailed) {
    return { name: 'Bike status', label: 'Unknown', icon: 'bluetooth', tone: 'wait' };
  }
  if (state.adapter === 'off') {
    return { name: 'Bluetooth', label: 'Off', icon: 'bluetooth-off', tone: 'bad' };
  }
  const label = state.device_label ?? 'Echelon bike';
  switch (state.ble) {
    case 'connected':
      return { name: label, label: 'Connected', icon: 'bluetooth', tone: 'ok' };
    case 'scanning':
    case 'starting':
      return { name: 'Echelon bike', label: 'Scanning…', icon: 'bluetooth-scan', tone: 'wait' };
    case 'connecting':
      return { name: label, label: 'Connecting…', icon: 'bluetooth', tone: 'wait' };
    case 'disconnected':
      return { name: label, label: 'Disconnected', icon: 'bluetooth-off', tone: 'bad' };
    default:
      return { name: 'Bike status', label: 'Error', icon: 'bluetooth-off', tone: 'bad' };
  }
}
