import {
  DEFAULT_TREADMILL_DRAFT,
  type TreadmillPlanDraft,
  applyTreadmillPreset,
  editTreadmillDraft,
  parseIncline,
  parseSpeed,
  stepTreadmillDraft,
  toTreadmillPlan,
  validateTreadmillDraft,
} from './treadmill-plan-form';

const flat: TreadmillPlanDraft = { ...DEFAULT_TREADMILL_DRAFT, mode: 'flat' };

describe('treadmill plan draft (L2-072, L2-067)', () => {
  it('starts from the treadmill defaults (AC4, AC5)', () => {
    expect(validateTreadmillDraft(DEFAULT_TREADMILL_DRAFT)).toEqual([]);
    expect(validateTreadmillDraft(flat)).toEqual([]);
  });

  it.each([
    ['9.0', 9],
    ['9', 9],
    ['16.0 km/h', 16],
    ['9.25', null],
    ['nine', null],
    ['', null],
  ])('parses speed %j as %j', (text, n) => {
    expect(parseSpeed(text)).toBe(n);
  });

  it.each([
    ['2', 2],
    ['2 %', 2],
    ['-1', -1],
    ['1.5', null],
    ['x', null],
  ])('parses incline %j as %j', (text, n) => {
    expect(parseIncline(text)).toBe(n);
  });

  it.each([
    ['workSpeed', '0.9', 'Speed must be 1.0 to 16.0 km/h.', 'Work speed — 1.0 to 16.0 km/h'],
    ['restSpeed', '16.1', 'Speed must be 1.0 to 16.0 km/h.', 'Recover speed — 1.0 to 16.0 km/h'],
    ['workSpeed', '9.25', 'Enter a speed like 9.0.', 'Work speed — 1.0 to 16.0 km/h'],
    ['restSpeed', 'fast', 'Enter a speed like 9.0.', 'Recover speed — 1.0 to 16.0 km/h'],
    ['workIncline', '-1', 'Incline must be 0 to 15 %.', 'Work incline — 0 to 15 %'],
    ['restIncline', '16', 'Incline must be 0 to 15 %.', 'Recover incline — 0 to 15 %'],
    ['restIncline', '1.5', 'Enter a whole number.', 'Recover incline — 0 to 15 %'],
  ] as const)('names hiit %s %j', (field, value, message, link) => {
    expect(validateTreadmillDraft({ ...DEFAULT_TREADMILL_DRAFT, [field]: value })).toEqual([
      { field, message, link },
    ]);
  });

  it.each([
    ['speed', '0.5', 'Speed must be 1.0 to 16.0 km/h.', 'Speed — 1.0 to 16.0 km/h'],
    ['incline', '16', 'Incline must be 0 to 15 %.', 'Incline — 0 to 15 %'],
    ['minutes', '0', 'Enter 1 to 180 minutes.', 'Duration — 1 to 180 min'],
  ] as const)('names flat %s %j', (field, value, message, link) => {
    expect(validateTreadmillDraft({ ...flat, [field]: value })).toEqual([{ field, message, link }]);
  });

  it('keeps the bike rules for rounds, work and recover', () => {
    expect(validateTreadmillDraft({ ...DEFAULT_TREADMILL_DRAFT, rounds: '31' })).toEqual([
      { field: 'rounds', message: 'Enter 1 to 30 rounds.', link: 'Rounds — enter 1 to 30' },
    ]);
  });

  it('ignores the other mode’s fields', () => {
    expect(validateTreadmillDraft({ ...DEFAULT_TREADMILL_DRAFT, speed: 'x' })).toEqual([]);
    expect(validateTreadmillDraft({ ...flat, workSpeed: 'x' })).toEqual([]);
  });

  it('steps speed by 0.5 within 1.0 to 16.0 and incline by 1 within 0 to 15 (AC6)', () => {
    expect(stepTreadmillDraft(DEFAULT_TREADMILL_DRAFT, 'workSpeed', 1).workSpeed).toBe('9.5');
    expect(stepTreadmillDraft({ ...flat, speed: '16.0' }, 'speed', 1).speed).toBe('16.0');
    expect(stepTreadmillDraft({ ...flat, speed: '1.2' }, 'speed', -1).speed).toBe('1.0');
    expect(stepTreadmillDraft({ ...flat, speed: 'x' }, 'speed', 1).speed).toBe('7.5');
    expect(stepTreadmillDraft(DEFAULT_TREADMILL_DRAFT, 'restIncline', -1).restIncline).toBe('0');
    expect(stepTreadmillDraft({ ...flat, incline: '15' }, 'incline', 1).incline).toBe('15');
    expect(stepTreadmillDraft(DEFAULT_TREADMILL_DRAFT, 'work', 1).work).toBe('0:45');
    expect(stepTreadmillDraft(flat, 'minutes', 1).minutes).toBe('35 min');
  });

  it('fills from a preset and clears it on edit', () => {
    const tabata = applyTreadmillPreset(DEFAULT_TREADMILL_DRAFT, 'tabata');
    expect(tabata).toMatchObject({ preset: 'tabata', rounds: '8', work: '0:20', rest: '0:10' });
    expect(tabata.workSpeed).toBe('9.0');
    expect(editTreadmillDraft(tabata, { rounds: '9' }).preset).toBeNull();
    expect(editTreadmillDraft(tabata, { workSpeed: '9.5' }).preset).toBe('tabata');
  });

  it('turns a valid draft into a treadmill plan', () => {
    expect(toTreadmillPlan(DEFAULT_TREADMILL_DRAFT)).toEqual({
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
    });
    expect(toTreadmillPlan({ ...flat, incline: '2' })).toEqual({
      kind: 'flat',
      level: null,
      minutes: 30,
      cadence: null,
      speed: 7,
      incline: 2,
    });
    expect(toTreadmillPlan({ ...flat, speed: '0' })).toBeNull();
  });
});
