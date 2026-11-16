import { announcement, bannerText } from './cue-text';

describe('cue-text (L2-027)', () => {
  it('work', () => {
    const c = {
      kind: 'work',
      level: 18,
      speed: null,
      incline: null,
      duration: 40,
      round: 5,
      rounds: 8,
      last: false,
      next: { kind: 'rest', level: 6, speed: null },
    } as const;
    expect(bannerText(c)).toEqual({ headline: 'WORK · 18 · GO!', detail: 'Round 5 of 8 · 0:40' });
    expect(announcement(c)).toBe('Work, resistance 18, 40 seconds');
  });
  it('recover, not last', () => {
    const c = {
      kind: 'rest',
      level: 6,
      speed: null,
      incline: null,
      duration: 20,
      round: 5,
      rounds: 8,
      last: false,
      next: { kind: 'work', level: 18, speed: null },
    } as const;
    expect(bannerText(c)).toEqual({ headline: 'RECOVER · 6', detail: '0:20 · next: Work at 18' });
    expect(announcement(c)).toBe('Recover, resistance 6, 20 seconds');
  });
  it('cool-down, last', () => {
    const c = {
      kind: 'cooldown',
      level: 6,
      speed: null,
      incline: null,
      duration: 120,
      round: null,
      rounds: 8,
      last: true,
      next: null,
    } as const;
    expect(bannerText(c)).toEqual({ headline: 'COOL-DOWN · 6', detail: '2:00 · last stretch' });
    expect(announcement(c)).toBe('Cool-down, resistance 6, 2 minutes');
  });
  it.each([
    ['warmup', 'WARM-UP'],
    ['steady', 'STEADY'],
  ] as const)('%s upper-cases as %s', (kind, word) => {
    const c = {
      kind,
      level: 8,
      speed: null,
      incline: null,
      duration: 180,
      round: null,
      rounds: 8,
      last: false,
      next: { kind: 'work', level: 18, speed: null },
    } as const;
    expect(bannerText(c).headline).toBe(`${word} · 8`);
  });

  it('treadmill work and recover in km/h', () => {
    const work = {
      kind: 'work',
      level: null,
      speed: 9,
      incline: 0,
      duration: 40,
      round: 5,
      rounds: 18,
      last: false,
      next: { kind: 'rest', level: null, speed: 7 },
    } as const;
    expect(bannerText(work)).toEqual({
      headline: 'WORK · 9.0 KM/H · GO!',
      detail: 'Round 5 of 18 · 0:40',
    });
    expect(announcement(work)).toBe('Work, 9.0 km/h, incline 0 %, 40 seconds');
    const rest = {
      ...work,
      kind: 'rest',
      speed: 7,
      incline: 1,
      duration: 20,
      next: { kind: 'work', level: null, speed: 9 },
    } as const;
    expect(bannerText(rest)).toEqual({
      headline: 'RECOVER · 7.0 KM/H',
      detail: '0:20 · next: Work at 9.0 km/h',
    });
    expect(announcement(rest)).toBe('Recover, 7.0 km/h, incline 1 %, 20 seconds');
  });
});
