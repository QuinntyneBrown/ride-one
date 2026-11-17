import {
  DEFAULT_INTERVALS,
  setListView,
  addSet,
  MAX_SETS,
  applyIntervalPreset,
  moveSet,
  removeSet,
  replaceSet,
  setFieldsOf,
  setLines,
  setStretch,
  stepSetField,
  stepStretchField,
  stretchFieldsOf,
  stretchLine,
  toIntervalsPlan,
  toSetDraft,
  toStretch,
  validateIntervals,
  validateSet,
  validateStretch,
} from './intervals-form';
import { testIntervalsPlan } from './test-state';

describe('intervals-form (L2-010 AC11-13, L2-029 AC11-15)', () => {
  it('starts on the Descending recoveries plan with its preset pressed (AC11)', () => {
    expect(DEFAULT_INTERVALS.preset).toBe('descending');
    expect(toIntervalsPlan(DEFAULT_INTERVALS)).toEqual(testIntervalsPlan());
  });

  it('applies the Even sets preset', () => {
    const d = applyIntervalPreset(DEFAULT_INTERVALS, 'even');
    expect(d.preset).toBe('even');
    expect(d.warmup).toEqual({ on: true, seconds: 180, level: 8, cadence: 80 });
    expect(d.cooldown).toEqual({ on: true, seconds: 120, level: 6, cadence: 70 });
    expect(d.sets).toEqual(
      Array(3).fill({
        rounds: 4,
        work_seconds: 40,
        work_level: 26,
        work_cadence: 100,
        rest_seconds: 20,
        rest_level: 12,
        rest_cadence: 72,
      }),
    );
  });

  it('adds, removes, moves and replaces sets, each clearing the preset (AC12)', () => {
    const last = DEFAULT_INTERVALS.sets[4];
    const added = addSet(DEFAULT_INTERVALS, last);
    expect(added.sets).toHaveLength(6);
    expect(added.preset).toBeNull();
    expect(removeSet(DEFAULT_INTERVALS, 0).sets.map((s) => s.rest_seconds)).toEqual([
      150, 120, 90, 0,
    ]);
    expect(moveSet(DEFAULT_INTERVALS, 0, 1).sets.map((s) => s.rest_seconds)).toEqual([
      150, 180, 120, 90, 0,
    ]);
    expect(moveSet(DEFAULT_INTERVALS, 0, -1)).toBe(DEFAULT_INTERVALS);
    expect(moveSet(DEFAULT_INTERVALS, 4, 1)).toBe(DEFAULT_INTERVALS);
    const replaced = replaceSet(DEFAULT_INTERVALS, 1, { ...last, rounds: 3 });
    expect(replaced.sets[1].rounds).toBe(3);
    expect(replaced.preset).toBeNull();
    expect(removeSet({ ...DEFAULT_INTERVALS, sets: [last] }, 0).sets).toEqual([last]);
  });

  it('turns a stretch off but keeps its values', () => {
    const off = setStretch(DEFAULT_INTERVALS, 'cooldown', {
      ...DEFAULT_INTERVALS.cooldown,
      on: false,
    });
    expect(off.preset).toBeNull();
    expect(toIntervalsPlan(off)?.cooldown).toBeNull();
    expect(off.cooldown.seconds).toBe(360);
  });

  it('writes the row lines', () => {
    expect(stretchLine(DEFAULT_INTERVALS.warmup)).toBe('5:00 · Level 8 · 80 rpm');
    expect(setLines(DEFAULT_INTERVALS.sets[1])).toEqual({
      work: '2 × 0:30 · L28 · 100 rpm',
      rest: 'Recover 2:30 · L8 · 72 rpm',
    });
    expect(setLines(DEFAULT_INTERVALS.sets[4]).rest).toBe('No recover');
  });

  it.each([
    ['rounds', '0', 'Enter 1 to 30 rounds.'],
    ['rounds', '31', 'Enter 1 to 30 rounds.'],
    ['rounds', 'x', 'Enter a whole number.'],
    ['work', '0:04', 'Work must be at least 0:05.'],
    ['work', '60:01', 'Work must be at most 60:00.'],
    ['rest', '0:03', 'Recover must be 0 (none) or at least 0:05.'],
    ['rest', '60:01', 'Recover must be at most 60:00.'],
    ['workCadence', '39 rpm', 'Cadence aim must be 40 to 150 rpm.'],
    ['restCadence', '151', 'Cadence aim must be 40 to 150 rpm.'],
  ] as const)('names a set %s of %s with %s (AC15)', (field, value, message) => {
    const fields = { ...setFieldsOf(DEFAULT_INTERVALS.sets[1]), [field]: value };
    expect(validateSet(fields)).toEqual({ [field]: message });
    expect(toSetDraft(fields)).toBeNull();
  });

  it('reads a recover of None or 0:00 as no recover', () => {
    const fields = setFieldsOf(DEFAULT_INTERVALS.sets[4]);
    expect(fields.rest).toBe('None');
    expect(toSetDraft(fields)?.rest_seconds).toBe(0);
    expect(toSetDraft({ ...fields, rest: '0:00' })?.rest_seconds).toBe(0);
  });

  it('steps set fields: rounds by 1, times and cadences by 5, recover through None', () => {
    const fields = setFieldsOf(DEFAULT_INTERVALS.sets[1]);
    expect(stepSetField(fields, 'rounds', 1).rounds).toBe('3');
    expect(stepSetField(fields, 'work', -1).work).toBe('0:25');
    expect(stepSetField(fields, 'workCadence', 1).workCadence).toBe('105 rpm');
    const none = { ...fields, rest: 'None' };
    expect(stepSetField(none, 'rest', 1).rest).toBe('0:05');
    expect(stepSetField({ ...fields, rest: '0:05' }, 'rest', -1).rest).toBe('None');
    expect(stepSetField(none, 'rest', -1).rest).toBe('None');
    expect(stepSetField({ ...fields, rounds: '30' }, 'rounds', 1).rounds).toBe('30');
  });

  it.each([
    ['warmup', '0:59', 'Warm-up must be 1:00 to 30:00.'],
    ['warmup', '30:01', 'Warm-up must be 1:00 to 30:00.'],
    ['cooldown', '0:30', 'Cool-down must be 1:00 to 30:00.'],
  ] as const)('names a %s duration of %s (AC15)', (kind, duration, message) => {
    const fields = { ...stretchFieldsOf(DEFAULT_INTERVALS[kind]), duration };
    expect(validateStretch(kind, fields)).toEqual({ duration: message });
    expect(toStretch(fields, true)).toBeNull();
  });

  it('steps a stretch: duration by 0:30 within 1:00 to 30:00, cadence by 5', () => {
    const fields = stretchFieldsOf(DEFAULT_INTERVALS.warmup);
    expect(fields).toEqual({ duration: '5:00', level: 8, cadence: '80 rpm' });
    expect(stepStretchField(fields, 'duration', -1).duration).toBe('4:30');
    expect(stepStretchField({ ...fields, duration: '1:00' }, 'duration', -1).duration).toBe('1:00');
    expect(stepStretchField(fields, 'cadence', 1).cadence).toBe('85 rpm');
    expect(toStretch(fields, true)).toEqual(DEFAULT_INTERVALS.warmup);
  });

  it('limits a plan to 30 efforts and 180 minutes (AC15, L2-010 AC13)', () => {
    const many = replaceSet(DEFAULT_INTERVALS, 1, { ...DEFAULT_INTERVALS.sets[1], rounds: 30 });
    expect(validateIntervals(many)).toEqual([
      { message: 'At most 30 efforts in a plan.', link: 'Sets — at most 30 efforts' },
    ]);
    expect(toIntervalsPlan(many)).toBeNull();
    const long = replaceSet(DEFAULT_INTERVALS, 1, {
      ...DEFAULT_INTERVALS.sets[1],
      work_seconds: 3600,
      rest_seconds: 3600,
    });
    expect(validateIntervals(long)).toEqual([
      { message: 'A ride can be at most 180 minutes.', link: 'Sets — at most 180 minutes' },
    ]);
    expect(validateIntervals(DEFAULT_INTERVALS)).toEqual([]);
  });
});

describe('setListView', () => {
  it('lists each set, both stretches and whether another set fits', () => {
    const view = setListView(DEFAULT_INTERVALS);
    expect(view.sets).toEqual(DEFAULT_INTERVALS.sets.map((s) => setLines(s)));
    expect(view.warmup).toEqual({
      kind: 'warmup',
      name: 'Warm-up',
      line: stretchLine(DEFAULT_INTERVALS.warmup),
      on: DEFAULT_INTERVALS.warmup.on,
    });
    expect(view.cooldown.name).toBe('Cool-down');
    expect(view.full).toBe(false);
    const full = { ...DEFAULT_INTERVALS, sets: Array(MAX_SETS).fill(DEFAULT_INTERVALS.sets[0]) };
    expect(setListView(full).full).toBe(true);
  });
});
