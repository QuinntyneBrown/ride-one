import { countdownCue } from './countdown-cue';

describe('countdownCue (L2-027)', () => {
  it.each([
    [6, false, false],
    [5, true, false],
    [4, true, false],
    [3, true, true],
    [2, true, true],
    [1, true, true],
    [0, false, false],
  ])('%i s left: pulse %s, beep %s', (left, pulse, beep) => {
    expect(countdownCue(left, true)).toEqual({ pulse, beep });
  });
  it('does nothing when not running', () => {
    expect(countdownCue(3, false)).toEqual({ pulse: false, beep: false });
  });
});
