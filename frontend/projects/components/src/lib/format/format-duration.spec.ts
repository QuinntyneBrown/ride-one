import { formatDuration } from '@wattzup/components';

describe('formatDuration', () => {
  it.each([
    [5, '0:05'],
    [125, '2:05'],
    [3599, '59:59'],
    [3600, '1:00:00'],
    [3800, '1:03:20'],
    [0, '0:00'],
  ])('formats %i s as %s', (seconds, text) => {
    expect(formatDuration(seconds)).toBe(text);
  });
});
