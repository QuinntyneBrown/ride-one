import {
  DEFAULT_TREADMILL_DRAFT,
  type TreadmillPlanDraft,
  applyTreadmillPreset,
  canStepSpeed,
  parseIncline,
  parseSpeed,
  presetPressed,
  presetsFor,
  stepTreadmillDraft,
  toTreadmillPlan,
  validateTreadmillDraft,
} from './treadmill-plan-form';

const flat: TreadmillPlanDraft = { ...DEFAULT_TREADMILL_DRAFT, mode: 'flat' };

describe('treadmill plan draft (L2-072, L2-067)', () => {
  it('starts from the Minute on and Hill walk defaults (AC4)', () => {
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
    ['workSpeed', '0.7', 'Speed must be 0.8 to 19.3 km/h.', 'Work speed — 0.8 to 19.3 km/h'],
    ['restSpeed', '19.4', 'Speed must be 0.8 to 19.3 km/h.', 'Recover speed — 0.8 to 19.3 km/h'],
    ['workSpeed', '9.25', 'Enter a speed like 9.0.', 'Work speed — 0.8 to 19.3 km/h'],
    ['restSpeed', 'fast', 'Enter a speed like 9.0.', 'Recover speed — 0.8 to 19.3 km/h'],
    ['workIncline', '-1', 'Incline must be 0 to 10 %.', 'Work incline — 0 to 10 %'],
    ['restIncline', '11', 'Incline must be 0 to 10 %.', 'Recover incline — 0 to 10 %'],
    ['restIncline', '1.5', 'Enter a whole number.', 'Recover incline — 0 to 10 %'],
  ] as const)('names hiit %s %j', (field, value, message, link) => {
    expect(validateTreadmillDraft({ ...DEFAULT_TREADMILL_DRAFT, [field]: value })).toEqual([
      { field, message, link },
    ]);
  });

  it.each([
    ['speed', '0.5', 'Speed must be 0.8 to 19.3 km/h.', 'Speed — 0.8 to 19.3 km/h'],
    ['incline', '11', 'Incline must be 0 to 10 %.', 'Incline — 0 to 10 %'],
    ['minutes', '0', 'Enter 1 to 180 minutes.', 'Duration — 1 to 180 min'],
  ] as const)('names flat %s %j', (field, value, message, link) => {
    expect(validateTreadmillDraft({ ...flat, [field]: value })).toEqual([{ field, message, link }]);
  });

  it.each([
    ['0.8', 'workSpeed'],
    ['19.3', 'restSpeed'],
  ] as const)('accepts the speed limit %s', (value, field) => {
    expect(validateTreadmillDraft({ ...DEFAULT_TREADMILL_DRAFT, [field]: value })).toEqual([]);
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

  it('steps speed by 0.5 within 0.8 to 19.3, incline by 1 within 0 to 10, duration by 5 (AC5, AC6)', () => {
    expect(stepTreadmillDraft(DEFAULT_TREADMILL_DRAFT, 'workSpeed', 1).workSpeed).toBe('13.5');
    expect(stepTreadmillDraft({ ...flat, speed: '19.0' }, 'speed', 1).speed).toBe('19.3');
    expect(stepTreadmillDraft({ ...flat, speed: '19.3' }, 'speed', 1).speed).toBe('19.3');
    expect(stepTreadmillDraft({ ...flat, speed: '1.0' }, 'speed', -1).speed).toBe('0.8');
    expect(stepTreadmillDraft({ ...flat, speed: 'x' }, 'speed', 1).speed).toBe('7.0');
    expect(stepTreadmillDraft(DEFAULT_TREADMILL_DRAFT, 'restIncline', -1).restIncline).toBe('0');
    expect(stepTreadmillDraft({ ...flat, incline: '10' }, 'incline', 1).incline).toBe('10');
    expect(stepTreadmillDraft(DEFAULT_TREADMILL_DRAFT, 'work', 1).work).toBe('1:05');
    expect(stepTreadmillDraft(flat, 'minutes', 1).minutes).toBe('35');
    expect(stepTreadmillDraft(flat, 'minutes', -1).minutes).toBe('25');
    expect(stepTreadmillDraft({ ...flat, minutes: '3' }, 'minutes', -1).minutes).toBe('1');
  });

  it.each([
    ['13.0', 1, true],
    ['19.3', 1, false],
    ['19.3', -1, true],
    ['0.8', -1, false],
    ['x', -1, true],
  ] as const)('canStepSpeed(%j, %i) is %s', (text, dir, can) => {
    expect(canStepSpeed(text, dir)).toBe(can);
  });

  it('offers the HIIT and the Steady presets (AC3)', () => {
    expect(presetsFor('hiit').map((p) => p.label)).toEqual([
      'Sprints 30/30',
      'Minute on',
      'Hill repeats',
      'Norwegian 4×4',
    ]);
    expect(presetsFor('flat').map((p) => p.label)).toEqual(['Hill walk', 'Easy run', 'Tempo']);
  });

  it.each([
    [
      'sprints-30-30',
      {
        rounds: '10',
        work: '0:30',
        rest: '0:30',
        workSpeed: '15.0',
        restSpeed: '5.5',
        workIncline: '1',
        restIncline: '0',
      },
    ],
    [
      'minute-on',
      {
        rounds: '6',
        work: '1:00',
        rest: '1:00',
        workSpeed: '13.0',
        restSpeed: '6.0',
        workIncline: '2',
        restIncline: '1',
      },
    ],
    [
      'hill-repeats',
      {
        rounds: '6',
        work: '1:30',
        rest: '1:30',
        workSpeed: '9.0',
        restSpeed: '5.5',
        workIncline: '8',
        restIncline: '0',
      },
    ],
    [
      'norwegian-4x4',
      {
        rounds: '4',
        work: '4:00',
        rest: '3:00',
        workSpeed: '12.5',
        restSpeed: '6.0',
        workIncline: '3',
        restIncline: '1',
      },
    ],
  ] as const)('fills the HIIT preset %s (AC3)', (id, values) => {
    const filled = applyTreadmillPreset({ ...DEFAULT_TREADMILL_DRAFT, rounds: '2' }, id);
    expect(filled).toMatchObject(values);
    expect(presetPressed(filled, id)).toBe(true);
  });

  it.each([
    ['hill-walk', { speed: '6.5', incline: '8', minutes: '30' }],
    ['easy-run', { speed: '9.5', incline: '1', minutes: '30' }],
    ['tempo', { speed: '12.5', incline: '1', minutes: '20' }],
  ] as const)('fills the Steady preset %s (AC3)', (id, values) => {
    const filled = applyTreadmillPreset(flat, id);
    expect(filled).toMatchObject(values);
    expect(presetPressed(filled, id)).toBe(true);
  });

  it('shows a preset pressed while every value it sets still matches (AC3, AC4)', () => {
    expect(presetPressed(DEFAULT_TREADMILL_DRAFT, 'minute-on')).toBe(true);
    expect(presetPressed(flat, 'hill-walk')).toBe(true);
    expect(presetPressed(DEFAULT_TREADMILL_DRAFT, 'hill-walk')).toBe(false);
    expect(presetPressed({ ...DEFAULT_TREADMILL_DRAFT, workSpeed: '13' }, 'minute-on')).toBe(true);
    expect(presetPressed({ ...DEFAULT_TREADMILL_DRAFT, work: '60' }, 'minute-on')).toBe(true);
    expect(presetPressed({ ...DEFAULT_TREADMILL_DRAFT, workSpeed: '13.5' }, 'minute-on')).toBe(
      false,
    );
    expect(presetPressed({ ...DEFAULT_TREADMILL_DRAFT, restIncline: '0' }, 'minute-on')).toBe(
      false,
    );
    expect(presetPressed({ ...DEFAULT_TREADMILL_DRAFT, warmup: false }, 'minute-on')).toBe(true);
  });

  it('turns a valid draft into a treadmill plan', () => {
    expect(toTreadmillPlan(DEFAULT_TREADMILL_DRAFT)).toEqual({
      kind: 'hiit',
      video: null,
      rounds: 6,
      work_seconds: 60,
      rest_seconds: 60,
      work_level: null,
      rest_level: null,
      warmup: true,
      cooldown: true,
      work_speed: 13,
      rest_speed: 6,
      work_incline: 2,
      rest_incline: 1,
    });
    expect(toTreadmillPlan(flat)).toEqual({
      kind: 'flat',
      video: null,
      level: null,
      minutes: 30,
      cadence: null,
      speed: 6.5,
      incline: 8,
    });
    expect(toTreadmillPlan({ ...flat, speed: '0' })).toBeNull();
  });
});
