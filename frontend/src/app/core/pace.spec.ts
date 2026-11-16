import { formatPace } from './pace';

describe('formatPace (L2-071 AC3)', () => {
  it.each([
    [9, '6:40'],
    [7, '8:34'],
    [12, '5:00'],
    [0, '--'],
    [null, '--'],
  ])('reads %j km/h as %j /km', (speed, pace) => {
    expect(formatPace(speed)).toBe(pace);
  });
});
