import { PROBE_KEY, probeReport, readWorldRideProbe } from './world-ride-probe';

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

describe('probeReport (#674)', () => {
  const global = globalThis as Record<string, unknown>;
  afterEach(() => delete global[PROBE_KEY]);

  it("records nothing on a rider's ride", () => {
    expect(probeReport('high', 'webgl2')).toBeNull();
    expect(global[PROBE_KEY]).toBeUndefined();
  });

  it('hands the sweep an empty report it can read as the renderer fills it', () => {
    global[PROBE_KEY] = { tier: 'low' };
    const report = probeReport('low', 'webgpu');
    expect(report).toEqual({
      tier: 'low',
      backend: 'webgpu',
      frames: [],
      drawCalls: 0,
      programs: 0,
    });
    report?.frames.push(16.7);
    expect((global[PROBE_KEY] as { report: unknown }).report).toBe(report);
  });
});
