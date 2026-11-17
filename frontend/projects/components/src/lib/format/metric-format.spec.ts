import { formatCount, formatDistance, formatLive, formatSpeed } from '@wattzup/components';

describe('metricFormat (L2-021, L2-022)', () => {
  it('shows -- for a null live value', () => {
    expect(formatLive(null)).toBe('--');
    expect(formatLive(317)).toBe('317');
  });
  it('formats speed to one decimal', () => {
    expect(formatSpeed(25.1)).toBe('25.1');
    expect(formatSpeed(0)).toBe('0.0');
    expect(formatSpeed(null)).toBe('--');
  });
  it('formats distance to 2 decimals and 0.00 before a ride', () => {
    expect(formatDistance(2.53)).toBe('2.53');
    expect(formatDistance(null)).toBe('0.00');
  });
  it('uses a thousands separator and 0 before a ride', () => {
    expect(formatCount(1284)).toBe('1,284');
    expect(formatCount(null)).toBe('0');
  });
});
