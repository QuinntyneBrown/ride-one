// Unit Test
// Traces to: L2-010, L2-017, L2-045, L2-049, L2-050, L2-092
// Description: Mirrors backend/tests/Wattzup.Core.Tests PlanExpanderTests, WorkoutSummaryTests,
// RideTotalsTests, PowerTraceHistoryTests and YouTubeLinkTests row for row.
import type { HiitPlan, IntervalsPlan, IntervalSet, Segment } from '@wattzup/api';
import { expand } from './plan-expander';
import { PowerTraceHistory } from './power-trace-history';
import { RideTotals } from './ride-totals';
import { summaryFor } from './workout-summary';
import { parseYouTubeId } from './youtube-link';

const seg = (
  kind: Segment['kind'],
  start: number,
  duration: number,
  level: number,
  cadence: number,
  round: number | null,
): Segment => ({ kind, start, duration, level, cadence, round });

const DEFAULT: HiitPlan = {
  kind: 'hiit',
  video: null,
  rounds: 8,
  work_seconds: 40,
  rest_seconds: 20,
  work_level: 18,
  rest_level: 6,
  warmup: true,
  cooldown: true,
};
const set = (rounds: number, rest: number, workLevel = 24): IntervalSet => ({
  rounds,
  work_seconds: 30,
  work_level: workLevel,
  work_cadence: 100,
  rest_seconds: rest,
  rest_level: 8,
  rest_cadence: 72,
});
const descending = (warmupLevel = 14, workLevel = 24): IntervalsPlan => ({
  kind: 'intervals',
  video: null,
  warmup: { seconds: 300, level: warmupLevel, cadence: 80 },
  sets: [
    [1, 180],
    [2, 150],
    [2, 120],
    [2, 90],
    [1, 0],
  ].map(([r, rest]) => set(r, rest, workLevel)),
  cooldown: { seconds: 360, level: 6, cadence: 70 },
});

describe('PlanExpander', () => {
  it('a flat plan is one steady segment', () => {
    expect(expand({ kind: 'flat', level: 12, minutes: 30, cadence: 85 })).toEqual([
      seg('steady', 0, 1800, 12, 85, null),
    ]);
  });
  it('a warm-up comes first at rest level + 2 with cadence 80', () => {
    expect(expand(DEFAULT)[0]).toEqual(seg('warmup', 0, 180, 8, 80, null));
  });
  it('each round is work then rest', () => {
    expect(expand({ ...DEFAULT, warmup: false, cooldown: false, rounds: 2 })).toEqual([
      seg('work', 0, 40, 18, 100, 1),
      seg('rest', 40, 20, 6, 72, 1),
      seg('work', 60, 40, 18, 100, 2),
      seg('rest', 100, 20, 6, 72, 2),
    ]);
  });
  it('a cool-down replaces the last rest', () => {
    const s = expand({ ...DEFAULT, warmup: false, rounds: 2 });
    expect(s.map((x) => x.kind)).toEqual(['work', 'rest', 'work', 'cooldown']);
    expect(s.at(-1)).toEqual(seg('cooldown', 100, 120, 6, 70, null));
  });
  it('the default plan has 17 segments and lasts 760 seconds', () => {
    const s = expand(DEFAULT);
    expect(s).toHaveLength(17);
    expect(s.reduce((n, x) => n + x.duration, 0)).toBe(760);
  });
  it('each start is the sum of the durations before it', () => {
    const s = expand(DEFAULT);
    s.forEach((x, i) => expect(x.start).toBe(s.slice(0, i).reduce((n, y) => n + y.duration, 0)));
  });
  it('an intervals plan is its warm-up, every effort and recover, and its cool-down', () => {
    const s = expand(descending());
    expect(s).toHaveLength(17);
    expect(s.at(-1)!.start + s.at(-1)!.duration).toBe(1800);
    expect(s[0]).toEqual(seg('warmup', 0, 300, 14, 80, null));
    expect(s[1]).toEqual(seg('work', 300, 30, 24, 100, 1));
    expect(s[2]).toEqual(seg('rest', 330, 180, 8, 72, 1));
    expect(s.at(-1)).toEqual(seg('cooldown', 1440, 360, 6, 70, null));
  });
  it('intervals rounds run across sets and a recover carries its effort round', () => {
    const s = expand(descending());
    expect(s.filter((x) => x.kind === 'work').map((x) => x.round)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(s.filter((x) => x.kind === 'rest').map((x) => x.round)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(s.filter((x) => x.kind === 'rest').map((x) => x.duration)).toEqual([
      180, 150, 150, 120, 120, 90, 90,
    ]);
  });
  it('a set with no recover runs its efforts back to back, and stretches can be off', () => {
    const plan: IntervalsPlan = {
      kind: 'intervals',
      video: null,
      warmup: null,
      sets: [{ ...set(2, 0, 28) }],
      cooldown: null,
    };
    expect(expand(plan)).toEqual([seg('work', 0, 30, 28, 100, 1), seg('work', 30, 30, 28, 100, 2)]);
  });
});

describe('WorkoutSummary', () => {
  it.each([
    [8, 40, 20, 'HIIT · 8 × 40s / 20s'],
    [8, 59, 20, 'HIIT · 8 × 59s / 20s'],
    [8, 60, 20, 'HIIT · 8 × 1:00 / 0:20'],
    [12, 240, 120, 'HIIT · 12 × 4:00 / 2:00'],
  ])('HIIT %i × %i / %i is %s', (rounds, work, rest, expected) => {
    expect(summaryFor({ ...DEFAULT, rounds, work_seconds: work, rest_seconds: rest })).toBe(
      expected,
    );
  });
  it('flat summary', () => {
    expect(summaryFor({ kind: 'flat', level: 12, minutes: 30, cadence: 85 })).toBe(
      'Flat · Level 12 · 30 min',
    );
  });
  it('intervals summary counts efforts and the total time', () => {
    expect(summaryFor(descending(8, 28))).toBe('Intervals · 8 efforts · 30:00');
  });
  it('intervals summary of one effort', () => {
    const plan: IntervalsPlan = {
      kind: 'intervals',
      video: null,
      warmup: null,
      sets: [set(1, 0, 28)],
      cooldown: null,
    };
    expect(summaryFor(plan)).toBe('Intervals · 1 effort · 0:30');
  });
});

describe('RideTotals', () => {
  it('before any running second the totals are zero', () => {
    const t = RideTotals.EMPTY;
    expect([t.avgPower, t.distanceKmRounded, t.kcal]).toEqual([0, 0, 0]);
  });
  it('an average of 208 over 760 seconds is 157 kcal', () => {
    let t = RideTotals.EMPTY;
    for (let i = 0; i < 760; i++) t = t.tick(208, 0);
    expect(t.avgPower).toBe(208);
    expect(t.kcal).toBe(157);
  });
  it('a missing power counts as zero', () => {
    expect(RideTotals.EMPTY.tick(300, null).tick(null, null).avgPower).toBe(150);
  });
  it('distance adds speed / 3600 each second', () => {
    let t = RideTotals.EMPTY;
    for (let i = 0; i < 360; i++) t = t.tick(0, 30);
    expect(t.distanceKmRounded).toBe(3);
  });
});

describe('PowerTraceHistory', () => {
  it('an empty history has no samples', () => {
    expect(new PowerTraceHistory().snapshot()).toEqual([]);
  });
  it('one sample is returned', () => {
    const h = new PowerTraceHistory();
    h.append(1, 317);
    expect(h.snapshot()).toEqual([{ rideSeconds: 1, power: 317 }]);
  });
  it.each([
    [10_800, 1],
    [10_801, 2],
  ])('the ring keeps the newest 10 800, oldest first (%i appended)', (count, first) => {
    const h = new PowerTraceHistory();
    for (let s = 1; s <= count; s++) h.append(s, s % 400);
    const samples = h.snapshot();
    expect(samples).toHaveLength(10_800);
    expect(samples[0].rideSeconds).toBe(first);
    expect(samples.at(-1)!.rideSeconds).toBe(count);
  });
  it('reset empties the history', () => {
    const h = new PowerTraceHistory();
    h.append(1, 317);
    h.reset();
    expect(h.snapshot()).toEqual([]);
  });
});

describe('YouTubeLink', () => {
  it.each([
    'https://www.youtube.com/watch?v=QUoToFsMNig',
    'http://www.youtube.com/watch?v=QUoToFsMNig',
    'www.youtube.com/watch?v=QUoToFsMNig',
    'youtube.com/watch?v=QUoToFsMNig',
    'https://m.youtube.com/watch?v=QUoToFsMNig&t=40',
    'm.youtube.com/watch?v=QUoToFsMNig&t=40',
    'https://www.youtube.com/watch?feature=share&v=QUoToFsMNig',
    'https://youtu.be/QUoToFsMNig',
    'youtu.be/QUoToFsMNig?t=12',
    'https://www.youtube.com/shorts/QUoToFsMNig',
    'youtube.com/shorts/QUoToFsMNig',
    'https://www.youtube.com/embed/QUoToFsMNig',
    'www.youtube.com/embed/QUoToFsMNig',
    '  https://youtu.be/QUoToFsMNig  ',
    'https://youtu.be/a-b_C1d2E3f',
  ])('%s gives the video id', (url) => {
    expect(parseYouTubeId(url)).toBe(url.includes('a-b_C1d2E3f') ? 'a-b_C1d2E3f' : 'QUoToFsMNig');
  });
  it.each([
    'https://vimeo.com/76979871',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/watch?v=QUoToFsMNig1',
    'https://www.youtube.com/watch?v=QUoToFs$Nig',
    'javascript:alert(1)',
    'https://www.youtube.com.evil.example/watch?v=QUoToFsMNig',
    'https://evil.example/youtu.be/QUoToFsMNig',
    'ftp://youtu.be/QUoToFsMNig',
    'https://www.youtube.com/channel/QUoToFsMNig',
    'https://www.youtube.com/watch',
    '',
  ])('%s is refused', (url) => {
    expect(parseYouTubeId(url)).toBeNull();
  });
  it('a link over 2048 characters is refused', () => {
    expect(
      parseYouTubeId('https://www.youtube.com/watch?v=QUoToFsMNig&x=' + 'a'.repeat(2048)),
    ).toBeNull();
  });
});
