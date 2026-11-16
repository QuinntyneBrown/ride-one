import { INCLINE_RANGE, levelAtFraction, levelForKey } from './level-picker-input';

describe('levelForKey', () => {
  const cases: [string, number | null, number | null][] = [
    ['ArrowRight', 18, 19],
    ['ArrowUp', 18, 19],
    ['ArrowLeft', 18, 17],
    ['ArrowDown', 18, 17],
    ['PageUp', 18, 22],
    ['PageDown', 18, 14],
    ['Home', 18, 1],
    ['End', 18, 32],
    ['ArrowRight', 32, 32],
    ['ArrowLeft', 1, 1],
    ['PageUp', 30, 32],
    ['PageDown', 2, 1],
    ['ArrowRight', null, 13],
    ['ArrowLeft', null, 11],
    ['Enter', 18, null],
    ['a', 18, null],
  ];
  for (const [key, current, expected] of cases) {
    it(`${key} from ${current} is ${expected}`, () => {
      expect(levelForKey(key, current)).toBe(expected);
    });
  }
});

describe('levelAtFraction', () => {
  const cases: [number, number][] = [
    [0, 1],
    [0.01, 1],
    [1 / 32, 2],
    [0.5, 17],
    [0.99, 32],
    [1, 32],
    [-0.2, 1],
    [1.3, 32],
  ];
  for (const [fraction, expected] of cases) {
    it(`${fraction} is level ${expected}`, () => {
      expect(levelAtFraction(fraction)).toBe(expected);
    });
  }
});

describe('the incline range (L2-072 AC5)', () => {
  const keys: [string, number | null, number | null][] = [
    ['ArrowRight', 2, 3],
    ['ArrowLeft', 0, 0],
    ['ArrowRight', 10, 10],
    ['PageUp', 2, 4],
    ['PageDown', 1, 0],
    ['Home', 5, 0],
    ['End', 5, 10],
    ['ArrowRight', null, 1],
  ];
  for (const [key, current, expected] of keys) {
    it(`${key} from ${current} is ${expected}`, () => {
      expect(levelForKey(key, current, INCLINE_RANGE)).toBe(expected);
    });
  }

  const taps: [number, number][] = [
    [0, 0],
    [1 / 11, 1],
    [0.5, 5],
    [0.99, 10],
    [1, 10],
  ];
  for (const [fraction, expected] of taps) {
    it(`a tap at ${fraction} picks ${expected}`, () => {
      expect(levelAtFraction(fraction, INCLINE_RANGE)).toBe(expected);
    });
  }
});
