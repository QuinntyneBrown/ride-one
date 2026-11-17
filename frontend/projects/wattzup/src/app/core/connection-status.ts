// The app bar's status line (L2-018). First matching row wins.
import type { BikeState, StreamConnection } from '@wattzup/api';
import { machineWords } from './machine-words';

import type { ConnectionStatus, StatusIcon, StatusTone } from '@wattzup/components';

export type { ConnectionStatus, StatusIcon, StatusTone };

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
  const machine = machineWords(state.machine);
  if (state.adapter === 'off') {
    return { name: 'Bluetooth', label: 'Off', icon: 'bluetooth-off', tone: 'bad' };
  }
  const label = state.device_label ?? machine.title;
  switch (state.ble) {
    case 'connected':
      return { name: label, label: 'Connected', icon: 'bluetooth', tone: 'ok' };
    case 'scanning':
    case 'starting':
      return { name: machine.title, label: 'Scanning…', icon: 'bluetooth-scan', tone: 'wait' };
    case 'connecting':
      return { name: label, label: 'Connecting…', icon: 'bluetooth', tone: 'wait' };
    case 'disconnected':
      return { name: label, label: 'Disconnected', icon: 'bluetooth-off', tone: 'bad' };
    default:
      return {
        name: `${machine.label} status`,
        label: 'Error',
        icon: 'bluetooth-off',
        tone: 'bad',
      };
  }
}
