import { resistanceView } from './resistance-view';
import { testState, testWorkout } from './test-state';

describe('resistanceView (L2-019)', () => {
  it.each([
    [18, 18, testWorkout(), '18', null, 18, 18, null],
    [null, null, null, '--', null, 0, null, null],
    [18, 22, testWorkout({ mode: 'manual' }), '18', 'Setting 22…', 18, 22, 18],
    [20, 20, testWorkout({ mode: 'manual' }), '20', null, 20, 20, 18],
  ])(
    'resistance %s target %s',
    (resistance, target, workout, valueText, settingText, litUpTo, pressed, plan) => {
      expect(resistanceView(testState({ resistance, target_resistance: target, workout }))).toEqual(
        { valueText, settingText, litUpTo, pressedLevel: pressed, planLevel: plan },
      );
    },
  );
});
