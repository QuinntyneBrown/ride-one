import { describe, expect, it } from 'vitest';
import { banners, isReconnect } from './connection-banners';
import { testState, testWorkout } from './test-state';

const base = {
  reconnected: null,
  dismissed: new Set<never>(),
};

describe('banners', () => {
  it('shows nothing for a connected, local, real bike', () => {
    expect(banners({ ...base, state: testState() })).toEqual([]);
  });

  it('shows Bluetooth is off with Open diagnostics', () => {
    const [b] = banners({ ...base, state: testState({ adapter: 'off' }) });
    expect(b.tone).toBe('danger');
    expect(b.action?.kind).toBe('diagnostics');
  });

  it('names ?simulate (L2-099)', () => {
    const state = testState({ simulated: true });
    expect(banners({ ...base, state })[0].text).toBe(
      'No hardware connected — Wattzup was opened with ?simulate and is generating cadence and resistance.',
    );
  });

  it('shows the simulated banner until dismissed', () => {
    const state = testState({ simulated: true });
    expect(banners({ ...base, state }).map((b) => b.id)).toEqual(['simulated']);
    expect(
      banners({ ...base, state, dismissed: new Set(['simulated' as const]) }).map((b) => b.id),
    ).toEqual([]);
  });

  it('writes the reconnected banner with elapsed and level', () => {
    const [b] = banners({
      ...base,
      state: testState(),
      reconnected: { label: 'Echelon EX-5s', elapsed: 432, level: 18 },
    });
    expect(b.text).toBe(
      'Echelon EX-5s is back. The plan picked up at 7:12 and resistance is set to 18.',
    );
  });
});

describe('isReconnect', () => {
  const active = testWorkout({ status: 'paused: bike disconnected' });
  it('is true when the bike comes back during an active workout', () => {
    expect(
      isReconnect(
        testState({ ble: 'disconnected', workout: active }),
        testState({ workout: testWorkout() }),
      ),
    ).toBe(true);
  });
  it('is false on the first state, with no workout, or when already connected', () => {
    expect(isReconnect(null, testState())).toBe(false);
    expect(
      isReconnect(testState({ ble: 'disconnected', workout: null }), testState({ workout: null })),
    ).toBe(false);
    expect(isReconnect(testState(), testState())).toBe(false);
  });
});
