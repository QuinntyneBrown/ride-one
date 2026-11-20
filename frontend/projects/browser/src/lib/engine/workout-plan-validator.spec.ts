// Unit Test
// Traces to: L2-010, L2-045, L2-092, L2-097
// Description: The workout plan validator, one case per table row, on JSON bodies.
import { validatePlan, VIDEO_LINK, VIDEO_START } from './workout-plan-validator';

const HIIT =
  '{"kind":"hiit","rounds":8,"work_seconds":40,"rest_seconds":20,"work_level":18,"rest_level":6,"warmup":true,"cooldown":true}';
const FLAT = '{"kind":"flat","level":12,"minutes":30,"cadence":85}';
const SET =
  '{"rounds":2,"work_seconds":30,"work_level":28,"work_cadence":100,"rest_seconds":150,"rest_level":8,"rest_cadence":72}';

const validate = (json: string) => validatePlan(JSON.parse(json));
function withField(json: string, field: string, value: string): string {
  const node = JSON.parse(json) as Record<string, unknown>;
  if (value === '<missing>') delete node[field];
  else node[field] = JSON.parse(value);
  return JSON.stringify(node);
}
const intervals = (
  sets: string,
  warmup = '{"seconds":300,"level":8,"cadence":80}',
  cooldown = 'null',
) => `{"kind":"intervals","warmup":${warmup},"sets":${sets},"cooldown":${cooldown}}`;
const setWith = (field: string, value: string) => withField(SET, field, value);
function descendingWith(...rests: number[]): string {
  const rounds = [1, 2, 2, 2, 1];
  const sets = rests.map(
    (rest, i) =>
      `{"rounds":${rounds[i]},"work_seconds":30,"work_level":24,"work_cadence":100,"rest_seconds":${rest},"rest_level":8,"rest_cadence":72}`,
  );
  return intervals(
    `[${sets.join(',')}]`,
    '{"seconds":300,"level":14,"cadence":80}',
    '{"seconds":360,"level":6,"cadence":70}',
  );
}

describe('WorkoutPlanValidator', () => {
  it('a valid HIIT plan is accepted', () => {
    const r = validate(HIIT);
    expect(r.errors).toEqual({});
    expect(r.plan).toEqual({ ...JSON.parse(HIIT), video: null });
  });

  it('a valid flat plan is accepted', () => {
    expect(validate(FLAT).plan).toEqual({ ...JSON.parse(FLAT), video: null });
  });

  it.each([
    ['rounds', '0', 'Enter 1 to 30 rounds.'],
    ['rounds', '31', 'Enter 1 to 30 rounds.'],
    ['work_seconds', '4', 'Work must be at least 0:05.'],
    ['rest_seconds', '4', 'Recover must be at least 0:05.'],
    ['work_seconds', '3601', 'Work must be at most 60:00.'],
    ['rest_seconds', '3601', 'Recover must be at most 60:00.'],
    ['work_level', '0', 'Level must be 1 to 32.'],
    ['rest_level', '33', 'Level must be 1 to 32.'],
    ['rounds', '<missing>', 'Enter a whole number.'],
    ['rounds', '8.5', 'Enter a whole number.'],
    ['rounds', '"8"', 'Enter a whole number.'],
    ['warmup', '1', 'Choose on or off.'],
    ['cooldown', '<missing>', 'Choose on or off.'],
  ])('HIIT %s = %s reads %s', (field, value, message) => {
    const r = validate(withField(HIIT, field, value));
    expect(r.plan).toBeNull();
    expect(r.errors[field]).toEqual([message]);
  });

  it.each([
    ['level', '33', 'Level must be 1 to 32.'],
    ['minutes', '0', 'Enter 1 to 180 minutes.'],
    ['minutes', '181', 'Enter 1 to 180 minutes.'],
    ['cadence', '39', 'Cadence goal must be 40 to 150 rpm.'],
    ['cadence', '151', 'Cadence goal must be 40 to 150 rpm.'],
  ])('flat %s = %s reads %s', (field, value, message) => {
    const r = validate(withField(FLAT, field, value));
    expect(r.plan).toBeNull();
    expect(r.errors[field]).toEqual([message]);
  });

  it.each(['{"kind":"tabata","rounds":8}', '{"rounds":8}', '[1,2]'])(
    'an unknown kind names kind only: %s',
    (json) => {
      const r = validate(json);
      expect(r.plan).toBeNull();
      expect(r.errors).toEqual({ kind: ['Choose HIIT, Intervals or Flat.'] });
    },
  );

  it('the Descending recoveries plan is accepted', () => {
    const r = validate(descendingWith(180, 150, 120, 90, 0));
    expect(r.errors).toEqual({});
    const plan = r.plan as Extract<typeof r.plan, { kind: 'intervals' }>;
    expect(plan.warmup).toEqual({ seconds: 300, level: 14, cadence: 80 });
    expect(plan.cooldown).toEqual({ seconds: 360, level: 6, cadence: 70 });
    expect(plan.sets.map((s) => s.rest_seconds)).toEqual([180, 150, 120, 90, 0]);
    expect(plan.sets[0]).toEqual({
      rounds: 1,
      work_seconds: 30,
      work_level: 24,
      work_cadence: 100,
      rest_seconds: 180,
      rest_level: 8,
      rest_cadence: 72,
    });
  });

  it('an intervals plan without warm-up or cool-down is accepted', () => {
    const plan = validate(intervals(`[${SET}]`, 'null')).plan as {
      warmup: unknown;
      cooldown: unknown;
    };
    expect(plan.warmup).toBeNull();
    expect(plan.cooldown).toBeNull();
  });

  it.each(['<missing>', '[]', '"three"', 'eleven'])('sets must hold 1 to 10 sets: %s', (sets) => {
    const json =
      sets === '<missing>'
        ? '{"kind":"intervals","warmup":null,"cooldown":null}'
        : sets === 'eleven'
          ? intervals(
              `[${Array(11)
                .fill(
                  '{"rounds":1,"work_seconds":30,"work_level":28,"work_cadence":100,"rest_seconds":0,"rest_level":8,"rest_cadence":72}',
                )
                .join(',')}]`,
            )
          : intervals(sets);
    const r = validate(json);
    expect(r.plan).toBeNull();
    expect(r.errors['sets']).toEqual(['Enter 1 to 10 sets.']);
  });

  it.each([
    ['rounds', '0', 'Enter 1 to 30 rounds.'],
    ['rounds', '31', 'Enter 1 to 30 rounds.'],
    ['work_seconds', '4', 'Work must be at least 0:05.'],
    ['work_seconds', '3601', 'Work must be at most 60:00.'],
    ['rest_seconds', '4', 'Recover must be 0 (none) or at least 0:05.'],
    ['rest_seconds', '1', 'Recover must be 0 (none) or at least 0:05.'],
    ['rest_seconds', '3601', 'Recover must be at most 60:00.'],
    ['rest_seconds', '-1', 'Recover must be 0 (none) or at least 0:05.'],
    ['work_level', '0', 'Level must be 1 to 32.'],
    ['rest_level', '33', 'Level must be 1 to 32.'],
    ['work_cadence', '39', 'Cadence aim must be 40 to 150 rpm.'],
    ['rest_cadence', '151', 'Cadence aim must be 40 to 150 rpm.'],
    ['work_cadence', '<missing>', 'Enter a whole number.'],
    ['rounds', '2.5', 'Enter a whole number.'],
  ])('a failing set field is named by its path: %s = %s', (field, value, message) => {
    const r = validate(intervals(`[${SET},${setWith(field, value)}]`));
    expect(r.plan).toBeNull();
    expect(r.errors).toEqual({ [`sets[1].${field}`]: [message] });
  });

  it('a set without a recover is accepted', () => {
    const plan = validate(intervals(`[${setWith('rest_seconds', '0')}]`)).plan as {
      sets: { rest_seconds: number }[];
    };
    expect(plan.sets[0].rest_seconds).toBe(0);
  });

  it.each([
    [
      'warmup',
      '{"seconds":59,"level":8,"cadence":80}',
      'warmup.seconds',
      'Warm-up must be 1:00 to 30:00.',
    ],
    [
      'warmup',
      '{"seconds":1801,"level":8,"cadence":80}',
      'warmup.seconds',
      'Warm-up must be 1:00 to 30:00.',
    ],
    [
      'cooldown',
      '{"seconds":59,"level":6,"cadence":70}',
      'cooldown.seconds',
      'Cool-down must be 1:00 to 30:00.',
    ],
    [
      'cooldown',
      '{"seconds":360,"level":33,"cadence":70}',
      'cooldown.level',
      'Level must be 1 to 32.',
    ],
    [
      'warmup',
      '{"seconds":300,"level":8,"cadence":151}',
      'warmup.cadence',
      'Cadence aim must be 40 to 150 rpm.',
    ],
    ['warmup', '{"level":8,"cadence":80}', 'warmup.seconds', 'Enter a whole number.'],
    ['warmup', 'true', 'warmup', 'Choose on or off.'],
    ['cooldown', '<missing>', 'cooldown', 'Choose on or off.'],
  ])('a failing %s field is named by its path (%s)', (stretch, value, field, message) => {
    const r = validate(withField(intervals(`[${SET}]`), stretch, value));
    expect(r.plan).toBeNull();
    expect(r.errors).toEqual({ [field]: [message] });
  });

  it('more than 30 efforts names sets', () => {
    const r = validate(intervals(`[${setWith('rounds', '16')},${setWith('rounds', '15')}]`));
    expect(r.plan).toBeNull();
    expect(r.errors['sets']).toEqual(['At most 30 efforts in a plan.']);
  });

  it('exactly 30 efforts is accepted', () => {
    expect(
      validate(intervals(`[${setWith('rounds', '15')},${setWith('rounds', '15')}]`)).errors,
    ).toEqual({});
  });

  it('a ride over 180 minutes names sets', () => {
    const set = withField(
      withField(setWith('rounds', '3'), 'work_seconds', '3600'),
      'rest_seconds',
      '5',
    );
    const r = validate(intervals(`[${set}]`));
    expect(r.plan).toBeNull();
    expect(r.errors['sets']).toEqual(['A ride can be at most 180 minutes.']);
  });

  it('a ride of exactly 180 minutes is accepted', () => {
    const sets = `[${withField(withField(setWith('rounds', '30'), 'work_seconds', '350'), 'rest_seconds', '0')}]`;
    expect(validate(intervals(sets)).errors).toEqual({});
  });

  it('every failing field is reported', () => {
    const r = validate(
      '{"kind":"hiit","rounds":31,"work_seconds":4,"rest_seconds":20,"work_level":33,"rest_level":6,"warmup":true}',
    );
    expect(Object.keys(r.errors).sort()).toEqual([
      'cooldown',
      'rounds',
      'work_level',
      'work_seconds',
    ]);
  });

  it.each([
    ['0', 0],
    ['12', 12],
    ['12.34', 12.3],
    ['12.35', 12.4],
    ['43200', 43200],
  ])('a valid video keeps only its id and the start point to 0.1 (%s)', (start, expected) => {
    const r = validate(
      withField(FLAT, 'video', `{"url":"https://youtu.be/QUoToFsMNig","start_seconds":${start}}`),
    );
    expect(r.errors).toEqual({});
    expect(r.plan!.video).toEqual({ video_id: 'QUoToFsMNig', start_seconds: expected });
  });

  it.each(['<missing>', 'null'])('no video gives a null video (%s)', (video) => {
    const r = validate(withField(FLAT, 'video', video));
    expect(r.errors).toEqual({});
    expect(r.plan!.video).toBeNull();
  });

  it.each(['-0.1', '43200.1', '"12"', 'null'])(
    'a start point out of range or not a number is named (%s)',
    (start) => {
      const r = validate(
        withField(HIIT, 'video', `{"url":"https://youtu.be/QUoToFsMNig","start_seconds":${start}}`),
      );
      expect(r.errors['video.start_seconds']).toEqual([VIDEO_START]);
    },
  );

  it.each([
    '{"url":"https://vimeo.com/76979871","start_seconds":0}',
    '{"url":42,"start_seconds":0}',
    '{"start_seconds":0}',
  ])('a link that is not YouTube is named (%s)', (video) => {
    expect(validate(withField(HIIT, 'video', video)).errors['video.url']).toEqual([VIDEO_LINK]);
  });

  it('a video that is not an object is named by its link', () => {
    const r = validate(withField(FLAT, 'video', '"https://youtu.be/QUoToFsMNig"'));
    expect(r.errors['video.url']).toEqual([VIDEO_LINK]);
  });
});
