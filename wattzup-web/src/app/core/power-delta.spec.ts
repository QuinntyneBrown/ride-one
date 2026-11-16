import { powerDelta } from './power-delta';

describe('powerDelta (L2-021)', () => {
  it.each([
    [317, 327, 'running', 'On target', 'on'],
    [521, 327, 'running', '+194 W', 'high'],
    [142, 327, 'running', '-185 W', 'low'],
    [353, 327, 'running', 'On target', 'on'],
    [354, 327, 'running', '+27 W', 'high'],
    [0, 327, 'paused', 'Paused', 'low'],
    [0, 327, 'waiting for bike', 'Paused', 'low'],
  ] as const)('power %i vs %i while %s reads %s', (power, target, status, text, tone) => {
    expect(powerDelta(power, target, status)).toEqual({ text, tone });
  });

  it('is null with no workout or no power', () => {
    expect(powerDelta(317, null, null)).toBeNull();
    expect(powerDelta(null, 327, 'running')).toBeNull();
  });
});
