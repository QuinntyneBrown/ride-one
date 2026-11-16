import { testState } from './test-state';
import { inclineView, speedView } from './treadmill-view';

const treadmill = (change: Parameters<typeof testState>[0] = {}) =>
  testState({ machine: 'treadmill', resistance: null, target_resistance: null, ...change });

describe('speedView (L2-071 AC1)', () => {
  it('shows the reported speed with its target and mph', () => {
    expect(speedView(treadmill({ speed_kmh: 9, speed_mph: 5.6, target_speed: 9 }))).toEqual({
      valueText: '9.0',
      mphText: '5.6 mph',
      targetText: 'Target 9.0 km/h',
      settingText: null,
    });
  });

  it('reads Setting while the treadmill catches up', () => {
    const v = speedView(treadmill({ speed_kmh: 7, speed_mph: 4.3, target_speed: 9 }));
    expect(v.settingText).toBe('Setting 9.0…');
    expect(v.targetText).toBeNull();
  });

  it('shows no target before one is sent, and -- before a report', () => {
    expect(speedView(treadmill({ speed_kmh: 0, speed_mph: 0, target_speed: null }))).toEqual({
      valueText: '0.0',
      mphText: '0.0 mph',
      targetText: null,
      settingText: null,
    });
    expect(speedView(treadmill({ speed_kmh: null, speed_mph: null })).valueText).toBe('--');
  });
});

describe('inclineView (L2-071 AC2)', () => {
  it('shows the reported incline with its target', () => {
    expect(inclineView(treadmill({ incline: 2, target_incline: 2 }))).toEqual({
      valueText: '2',
      targetText: 'Target 2 %',
      settingText: null,
    });
  });

  it('reads Setting when the target differs', () => {
    expect(inclineView(treadmill({ incline: 2, target_incline: 3 })).settingText).toBe(
      'Setting 3…',
    );
  });

  it('reads -- before a report', () => {
    expect(inclineView(treadmill({ incline: null, target_incline: null }))).toEqual({
      valueText: '--',
      targetText: null,
      settingText: null,
    });
  });
});
