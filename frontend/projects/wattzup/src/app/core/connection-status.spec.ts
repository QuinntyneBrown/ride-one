import { connectionStatus } from './connection-status';
import { testState } from './test-state';

describe('connectionStatus (L2-018)', () => {
  it.each([
    ['connected', {}, 'Echelon EX-5s', 'Connected', 'bluetooth', 'ok'],
    ['scanning', { ble: 'scanning' }, 'Echelon bike', 'Scanning…', 'bluetooth-scan', 'wait'],
    ['starting', { ble: 'starting' }, 'Echelon bike', 'Scanning…', 'bluetooth-scan', 'wait'],
    ['connecting', { ble: 'connecting' }, 'Echelon EX-5s', 'Connecting…', 'bluetooth', 'wait'],
    [
      'disconnected',
      { ble: 'disconnected' },
      'Echelon EX-5s',
      'Disconnected',
      'bluetooth-off',
      'bad',
    ],
    [
      'disconnected, no label',
      { ble: 'disconnected', device_label: null },
      'Echelon bike',
      'Disconnected',
      'bluetooth-off',
      'bad',
    ],
    [
      'no bike chosen yet (L2-090 AC1)',
      { ble: 'disconnected', device: null, device_label: null },
      'No bike connected',
      '',
      'bluetooth',
      'quiet',
    ],
    ['adapter off', { ble: 'error', adapter: 'off' }, 'Bluetooth', 'Off', 'bluetooth-off', 'bad'],
    ['error', { ble: 'error' }, 'Bike status', 'Error', 'bluetooth-off', 'bad'],
  ] as const)('%s', (_, change, name, label, icon, tone) => {
    expect(connectionStatus(testState(change))).toEqual({ name, label, icon, tone });
  });

  it('reads Unknown with no state', () => {
    expect(connectionStatus(null)).toEqual({
      name: 'Bike status',
      label: 'Unknown',
      icon: 'bluetooth',
      tone: 'wait',
    });
  });

  it.each(['unsupported', 'insecure'] as const)(
    'reads Bluetooth · Unavailable in this browser when the page cannot reach it (%s, L2-089)',
    (support) => {
      expect(connectionStatus(testState(), support)).toEqual({
        name: 'Bluetooth',
        label: 'Unavailable in this browser',
        icon: 'bluetooth-off',
        tone: 'wait',
      });
    },
  );
});
