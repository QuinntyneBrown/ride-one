import { previewOf, treadmillPreviewOf } from './ride-preview';

describe('previewOf (L2-059)', () => {
  it('previews the default plan', () => {
    const p = previewOf({
      kind: 'hiit',
      rounds: 8,
      work_seconds: 40,
      rest_seconds: 20,
      work_level: 18,
      rest_level: 6,
      warmup: true,
      cooldown: true,
      work_speed: null,
      rest_speed: null,
      work_incline: null,
      rest_incline: null,
    });
    expect(p.total).toBe('12:40');
    expect(p.totalSeconds).toBe(760);
    expect(p.structure).toBe('8 × 0:40 / 0:20');
    expect(p.timeUnderLoad).toBe('5:20');
    expect(p.peakLevel).toBe(18);
    expect(p.avgPower).toBe(211);
    expect(p.kcal).toBe(160);
    expect(p.legend).toEqual(['work', 'rest']);
  });

  it('previews a flat plan without time under load', () => {
    const p = previewOf({
      kind: 'flat',
      level: 12,
      minutes: 30,
      cadence: 85,
      speed: null,
      incline: null,
    });
    expect(p.total).toBe('30:00');
    expect(p.structure).toBe('Level 12 throughout');
    expect(p.timeUnderLoad).toBeNull();
    expect(p.peakLevel).toBe(12);
    expect(p.avgPower).toBe(205);
    expect(p.kcal).toBe(367);
    expect(p.legend).toEqual(['steady']);
  });

  it('draws one profile bar per segment in a 0 0 <total> 32 box', () => {
    const p = previewOf({
      kind: 'hiit',
      rounds: 8,
      work_seconds: 40,
      rest_seconds: 20,
      work_level: 18,
      rest_level: 6,
      warmup: true,
      cooldown: true,
      work_speed: null,
      rest_speed: null,
      work_incline: null,
      rest_incline: null,
    });
    expect(p.profile.length).toBe(17);
    const [warmup, work, rest] = p.profile;
    expect(warmup).toEqual({ x: 1.52, width: 176.96, y: 24, height: 8, tone: 'is-easy' });
    expect(work).toEqual({ x: 181.52, width: 36.96, y: 14, height: 18, tone: 'is-work' });
    expect(rest).toEqual({ x: 221.52, width: 16.96, y: 26, height: 6, tone: 'is-rest' });
    expect(p.profile.at(-1)?.tone).toBe('is-easy');
  });
});

describe('treadmillPreviewOf (L2-072 AC8)', () => {
  const hiit = {
    kind: 'hiit',
    rounds: 18,
    work_seconds: 40,
    rest_seconds: 20,
    work_level: null,
    rest_level: null,
    warmup: true,
    cooldown: true,
    work_speed: 9,
    rest_speed: 7,
    work_incline: 0,
    rest_incline: 0,
  } as const;

  it('previews the treadmill HIIT default with top speed and expected distance', () => {
    const p = treadmillPreviewOf(hiit);
    expect(p.total).toBe('22:40');
    expect(p.topSpeed).toBe(9);
    expect(p.distanceKm).toBeCloseTo(3.094, 3);
    expect(p.profileLabel).toBe('Speed profile: 18 × 0:40 / 0:20');
    expect(p.rows).toEqual([
      { term: 'Structure', value: '18 × 0:40 / 0:20' },
      { term: 'Time under load', value: '12:00' },
      { term: 'Top speed', value: '9.0 km/h' },
      { term: 'Expected distance', value: '~3.1 km' },
    ]);
  });

  it('draws each bar two units per km/h', () => {
    const [warmup, work] = treadmillPreviewOf(hiit).profile;
    expect(warmup).toMatchObject({ y: 16, height: 16, tone: 'is-easy' });
    expect(work).toMatchObject({ y: 14, height: 18, tone: 'is-work' });
  });

  it('previews a treadmill flat plan', () => {
    const p = treadmillPreviewOf({
      kind: 'flat',
      level: null,
      minutes: 30,
      cadence: null,
      speed: 7,
      incline: 0,
    });
    expect(p.rows).toEqual([
      { term: 'Structure', value: '7.0 km/h throughout' },
      { term: 'Top speed', value: '7.0 km/h' },
      { term: 'Expected distance', value: '~3.5 km' },
    ]);
    expect(p.legend).toEqual(['steady']);
  });
});
