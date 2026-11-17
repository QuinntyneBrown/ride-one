import { describe, expect, it } from 'vitest';
import type { BikeState, NearbyMachine } from '@wattzup/api';
import type { MachineHistory } from './machine-history.store';
import {
  cardStatus,
  isNotFound,
  lastSessionText,
  machineCardView,
  nearbyHeading,
} from './machine-page-view';
import { testState } from './test-state';

const TODAY = new Date(2026, 10, 15, 19, 10);
const BIKE: NearbyMachine = {
  machine: 'bike',
  name: 'ECHEX-3-141844',
  label: 'Echelon EX-5s',
  rssi: -68,
  signal: 3,
  seen_at: 0,
};
const NO_HISTORY: MachineHistory = { lastUsed: null, sessions: {} };
const NOT_FOUND = 'No Echelon treadmill found yet — switch it on to wake it up';

const withNearby = (nearby: NearbyMachine[], change: Partial<BikeState> = {}): BikeState =>
  testState({ nearby, ...change });

describe('nearbyHeading (L2-073 AC4)', () => {
  it('reads Looking for machines while there is no state', () => {
    expect(nearbyHeading(null)).toBe('Looking for machines…');
  });
  it('reads No machines nearby for an empty list', () => {
    expect(nearbyHeading(withNearby([]))).toBe('No machines nearby');
  });
  it('reads the count otherwise', () => {
    expect(nearbyHeading(withNearby([BIKE, { ...BIKE, machine: 'treadmill' }]))).toBe(
      '2 machines nearby',
    );
  });
});

describe('machineCardView (L2-073 AC2, AC3)', () => {
  it('shows the nearby entry for a machine heard', () => {
    const view = machineCardView('bike', withNearby([BIKE]), NO_HISTORY, TODAY);
    expect(view).toEqual({
      kind: 'Bike',
      name: 'Echelon EX-5s',
      advertisedName: 'ECHEX-3-141844',
      signal: 3,
      signalLabel: 'Signal 3 of 4',
      controls: 'Resistance, levels 1–32',
      lastSession: 'None yet',
      lastUsed: false,
      cta: 'Ride the bike',
    });
  });

  it('shows the defaults for a machine not heard', () => {
    const view = machineCardView('treadmill', withNearby([BIKE]), NO_HISTORY, TODAY);
    expect(view.name).toBe('Echelon Stride');
    expect(view.advertisedName).toBe('Not heard yet');
    expect(view.signal).toBe(0);
    expect(view.signalLabel).toBe('Signal 0 of 4');
    expect(view.controls).toBe('Speed 0.8–19.3 km/h, incline 0–10%');
    expect(view.cta).toBe('Run on the Stride');
  });

  it('shows the defaults while there is no state', () => {
    expect(machineCardView('bike', null, NO_HISTORY, TODAY).name).toBe('Echelon bike');
  });

  it('marks the last used machine and shows its session', () => {
    const history: MachineHistory = {
      lastUsed: 'treadmill',
      sessions: {
        treadmill: {
          machine: 'treadmill',
          summary: 'Hill walk 30 min',
          started_at: new Date(2026, 10, 11, 7, 0).toISOString(),
        },
      },
    };
    const view = machineCardView('treadmill', null, history, TODAY);
    expect(view.lastUsed).toBe(true);
    expect(view.lastSession).toBe('Hill walk 30 min · 4 days ago');
    expect(machineCardView('bike', null, history, TODAY).lastUsed).toBe(false);
  });
});

describe('lastSessionText (L2-073 AC2)', () => {
  const at = (y: number, m: number, d: number, h = 7) => new Date(y, m, d, h).toISOString();
  it('reads today', () => {
    expect(lastSessionText('Minute on', at(2026, 10, 15, 6), TODAY)).toBe('Minute on · today');
  });
  it('reads yesterday, by calendar day', () => {
    expect(lastSessionText('Minute on', at(2026, 10, 14, 23), TODAY)).toBe('Minute on · yesterday');
  });
  it('reads n days ago', () => {
    expect(lastSessionText('Minute on', at(2026, 10, 12), TODAY)).toBe('Minute on · 3 days ago');
  });
});

describe('cardStatus (L2-073 AC6, AC7)', () => {
  it('is idle when the machine is not picked', () => {
    expect(cardStatus('bike', 'treadmill', false)).toEqual({ kind: 'idle' });
  });
  it('is connecting while the pick is on its way', () => {
    expect(cardStatus('treadmill', 'treadmill', false)).toEqual({
      kind: 'connecting',
      text: 'Connecting to treadmill…',
    });
    expect(cardStatus('bike', 'bike', false)).toEqual({
      kind: 'connecting',
      text: 'Connecting to bike…',
    });
  });
  it('is not found once the scan reported nothing', () => {
    expect(cardStatus('treadmill', 'treadmill', true)).toEqual({
      kind: 'not-found',
      text: 'The Stride isn’t answering. Check it’s switched on and the safety key is clipped in.',
    });
    expect(cardStatus('bike', 'bike', true)).toEqual({
      kind: 'not-found',
      text: 'The bike isn’t answering. Give the pedals a turn to wake it.',
    });
  });
});

describe('isNotFound (L2-063 AC8)', () => {
  it('reads the scan error of the picked machine', () => {
    const scanError = { machine: 'treadmill', error: NOT_FOUND } as const;
    expect(isNotFound('treadmill', scanError)).toBe(true);
    expect(isNotFound('bike', scanError)).toBe(false);
    expect(isNotFound('treadmill', { machine: 'treadmill', error: 'BluetoothError: x' })).toBe(
      false,
    );
    expect(isNotFound('treadmill', null)).toBe(false);
  });
});
