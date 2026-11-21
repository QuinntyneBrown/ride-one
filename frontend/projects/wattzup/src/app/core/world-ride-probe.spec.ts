import { readWorldRideProbe } from './world-ride-probe';

describe('readWorldRideProbe (test-only tier hook, #672)', () => {
  it.each(['low', 'medium', 'high', 'ultra'] as const)('pins %s', (tier) => {
    expect(readWorldRideProbe({ tier })).toEqual({ tier });
  });

  it.each([
    ['nothing set', undefined],
    ['null', null],
    ['a string', 'low'],
    ['an unknown tier', { tier: 'max' }],
    ['no tier', {}],
  ])('is off with %s', (_, value) => {
    expect(readWorldRideProbe(value)).toBeNull();
  });
});
