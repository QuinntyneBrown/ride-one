import type { ClassEntry, WorkoutPlan } from '@wattzup/api';
import { cadenceLine, draftOf, levelRows, stretchLine, structureLine } from './class-draft';

const set = (rounds: number, rest: number, change: object = {}) => ({
  rounds,
  work_seconds: 30,
  work_level: 24,
  work_cadence: 98,
  rest_seconds: rest,
  rest_level: 6,
  rest_cadence: 72,
  ...change,
});

const HIIT_CARDIO: WorkoutPlan = {
  kind: 'intervals',
  warmup: { seconds: 300, level: 8, cadence: 80 },
  sets: [set(1, 180), set(2, 150), set(2, 120), set(2, 90), set(1, 0)],
  cooldown: { seconds: 360, level: 6, cadence: 70 },
  video: { video_id: 'QUoToFsMNig', start_seconds: 12 },
};

const FLAT: WorkoutPlan = {
  kind: 'flat',
  level: 12,
  minutes: 60,
  cadence: 85,
  speed: null,
  incline: null,
  video: null,
};

const HIIT: WorkoutPlan = {
  kind: 'hiit',
  rounds: 8,
  work_seconds: 40,
  rest_seconds: 20,
  work_level: 18,
  rest_level: 6,
  warmup: true,
  cooldown: false,
  work_speed: null,
  rest_speed: null,
  work_incline: null,
  rest_incline: null,
  video: null,
};

function classOf(plan: WorkoutPlan): ClassEntry {
  return {
    id: 'a-class',
    title: 'A Class',
    channel: 'GCN Training',
    focus: 'HIIT',
    description: '',
    shelf: { id: '30-min', title: '30 min', tagline: '' },
    plan,
  };
}

describe('class-draft (L2-080)', () => {
  it('starts from the class: its plan, its link and its start point (AC2, AC3)', () => {
    expect(draftOf(classOf(HIIT_CARDIO))).toEqual({
      plan: HIIT_CARDIO,
      url: 'https://www.youtube.com/watch?v=QUoToFsMNig',
      start: 12,
    });
    expect(draftOf(classOf(FLAT))).toEqual({ plan: FLAT, url: '', start: 0 });
  });

  it('shows Work and Recover rows at the highest level of each, or one Steady row (AC7, AC8)', () => {
    expect(levelRows(HIIT_CARDIO)).toEqual([
      { name: 'Work', level: 24, canLower: true, canRaise: true },
      { name: 'Recover', level: 6, canLower: true, canRaise: true },
    ]);
    expect(levelRows(FLAT)).toEqual([
      { name: 'Steady', level: 12, canLower: true, canRaise: true },
    ]);
    expect(levelRows({ ...FLAT, level: 32 })[0]).toMatchObject({ canRaise: false });
    expect(levelRows({ ...HIIT, rest_level: 1 })[1]).toMatchObject({ canLower: false });
  });

  it.each([
    ['intervals with shrinking recovers', HIIT_CARDIO, '8 × 0:30 · 3:00 → 1:30 recover'],
    [
      'intervals with equal recovers',
      { ...HIIT_CARDIO, sets: [set(4, 60), set(2, 60), set(1, 0)] },
      '7 × 0:30 / 1:00',
    ],
    ['hiit', HIIT, '8 × 0:40 / 0:20'],
    ['flat', FLAT, 'Level 12 throughout'],
  ] as const)('writes the structure of %s (AC6)', (_, plan, line) => {
    expect(structureLine(plan as WorkoutPlan)).toBe(line);
  });

  it('writes the cadence from the first work and recover aims, or the steady aim (AC6)', () => {
    expect(cadenceLine(HIIT_CARDIO)).toBe('98 / 72 rpm');
    expect(cadenceLine(FLAT)).toBe('85 rpm');
    expect(cadenceLine(HIIT)).toMatch(/^\d+ \/ \d+ rpm$/);
  });

  it('writes the warm-up and cool-down, each only when present (AC6)', () => {
    expect(stretchLine(HIIT_CARDIO)).toBe('5:00 warm-up · 6:00 cool-down');
    expect(stretchLine({ ...HIIT_CARDIO, cooldown: null })).toBe('5:00 warm-up');
    expect(stretchLine(HIIT)).toMatch(/^\d+:\d\d warm-up$/);
    expect(stretchLine(FLAT)).toBeNull();
  });
});
