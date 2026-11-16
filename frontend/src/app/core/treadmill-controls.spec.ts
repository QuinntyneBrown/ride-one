import { testState, testWorkout } from './test-state';
import {
  baseIncline,
  baseSpeed,
  stepIncline,
  stepSpeed,
  treadmillControlsState,
  treadmillPlanNote,
} from './treadmill-controls';

const treadmill = (change: Parameters<typeof testState>[0] = {}) =>
  testState({ machine: 'treadmill', speed_kmh: 9, target_speed: 9, incline: 2, ...change });

describe('treadmill controls (L2-071 AC5, AC6)', () => {
  it.each([
    [{ speed_kmh: 9, target_speed: 8 }, 9],
    [{ speed_kmh: 0, target_speed: 8 }, 8],
    [{ speed_kmh: null, target_speed: null }, 7],
    [{ speed_kmh: 0, target_speed: null }, 7],
  ])('bases speed on %j as %j', (change, base) => {
    expect(baseSpeed(treadmill(change))).toBe(base);
  });

  it.each([
    [{ incline: 2, target_incline: 5 }, 2],
    [{ incline: null, target_incline: 5 }, 5],
    [{ incline: null, target_incline: null }, 0],
  ])('bases incline on %j as %j', (change, base) => {
    expect(baseIncline(treadmill(change))).toBe(base);
  });

  it('steps speed by 0.5 within 0.8 to 19.3', () => {
    expect(stepSpeed(treadmill(), 1)).toBe(9.5);
    expect(stepSpeed(treadmill(), -1)).toBe(8.5);
    expect(stepSpeed(treadmill({ speed_kmh: 19 }), 1)).toBe(19.3);
    expect(stepSpeed(treadmill({ speed_kmh: 1 }), -1)).toBe(0.8);
  });

  it('steps incline by 1 within 0 to 10', () => {
    expect(stepIncline(treadmill(), 1)).toBe(3);
    expect(stepIncline(treadmill({ incline: 0 }), -1)).toBe(0);
    expect(stepIncline(treadmill({ incline: 10 }), 1)).toBe(10);
  });

  it('disables each button at its limit', () => {
    expect(treadmillControlsState(treadmill({ speed_kmh: 19.3, incline: 0 }), true)).toEqual({
      lowerSpeedDisabled: false,
      raiseSpeedDisabled: true,
      lowerInclineDisabled: true,
      raiseInclineDisabled: false,
    });
    expect(treadmillControlsState(treadmill({ speed_kmh: 0.8, incline: 10 }), true)).toEqual({
      lowerSpeedDisabled: true,
      raiseSpeedDisabled: false,
      lowerInclineDisabled: false,
      raiseInclineDisabled: true,
    });
  });

  it('disables every button while commands are off', () => {
    expect(Object.values(treadmillControlsState(treadmill(), false))).toEqual([
      true,
      true,
      true,
      true,
    ]);
  });
});

describe('treadmillPlanNote', () => {
  it('says the plan or the rider is in control', () => {
    expect(treadmillPlanNote(treadmill({ workout: null })).text).toBe(
      'Manual control — no plan is running.',
    );
    expect(treadmillPlanNote(treadmill()).text).toBe(
      'Following the plan — speed and incline change with each interval.',
    );
    expect(treadmillPlanNote(treadmill({ workout: testWorkout({ mode: 'manual' }) }))).toEqual({
      text: 'Manual speed and incline. Plan takes over next interval.',
      backToPlan: true,
    });
  });
});
