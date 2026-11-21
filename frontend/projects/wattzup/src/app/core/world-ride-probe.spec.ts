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
    expect(probeReport('high', 'webgl2', true)).toBeNull();
    expect(global[PROBE_KEY]).toBeUndefined();
  });

  it('hands the sweep an empty report it can read as the renderer fills it', () => {
    global[PROBE_KEY] = { tier: 'low' };
    const report = probeReport('low', 'webgpu', true);
    expect(report).toEqual({
      tier: 'low',
      backend: 'webgpu',
      frames: [],
      gpuMs: [],
      drawCalls: 0,
      programs: 0,
    });
    report?.frames.push(16.7);
    expect((global[PROBE_KEY] as { report: unknown }).report).toBe(report);
  });

  it('writes null GPU time, not none, when the browser offers no timer query (#675)', () => {
    global[PROBE_KEY] = { tier: 'low' };
    expect(probeReport('low', 'webgl2', false)).toHaveProperty('gpuMs', null);
  });
});
