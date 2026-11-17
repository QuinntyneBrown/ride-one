import { formatAvgPace, formatPace } from './pace';

describe('formatPace (L2-071 AC2)', () => {
  it.each([
    [13, '4:37'],
    [9, '6:40'],
    [12, '5:00'],
    [0.5, '120:00'],
    [0.4, '–:––'],
    [0, '–:––'],
    [null, '–:––'],
  ])('reads %j km/h as %j /km', (speed, pace) => {
    expect(formatPace(speed)).toBe(pace);
  });
});

describe('formatAvgPace (L2-071 AC7)', () => {
  it.each([
    [427, 1.05, '6:47'],
    [573, 1.41, '6:46'],
    [60, 0.2, '5:00'],
    [427, 0, '–:––'],
    [0, null, '–:––'],
  ])('reads %d s over %j km as %j /km', (elapsed, km, pace) => {
    expect(formatAvgPace(elapsed, km)).toBe(pace);
  });
});
