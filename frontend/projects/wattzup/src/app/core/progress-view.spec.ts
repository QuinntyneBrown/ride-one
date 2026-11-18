import type {
  AchievementFigures,
  ClassAttempts,
  ProgressReport,
  SessionSummary,
} from '@wattzup/api';
import {
  achievementView,
  comparable,
  rideLabel,
  sessionRow,
  streakLink,
  streakView,
  trendView,
} from './progress-view';

function attempt(id: string, day: number, change: Partial<SessionSummary> = {}): SessionSummary {
  return {
    id,
    ended_at: `2026-11-${String(day).padStart(2, '0')}T18:00:00+00:00`,
    class_id: 'hiit',
    title: 'HIIT',
    ridden_seconds: 1800,
    planned_seconds: 1800,
    completed: true,
    avg_power: 150,
    on_target_pct: 90,
    dip_count: 2,
    ...change,
  };
}

const hiit: ClassAttempts = {
  class_id: 'hiit',
  title: 'HIIT',
  attempts: [
    attempt('a1', 3, { avg_power: 145, on_target_pct: 86, dip_count: 9 }),
    attempt('a2', 9, { avg_power: 155, on_target_pct: 99, dip_count: 0 }),
    attempt('a3', 17, { avg_power: 153, on_target_pct: 97, dip_count: 1 }),
  ],
};

function progress(change: Partial<ProgressReport> = {}): ProgressReport {
  return {
    today: '2026-11-18',
    streak: { current: 3, best: 6, rode_today: false },
    ride_days: ['2026-11-16', '2026-11-17'],
    week: { rides: 2, goal: 4 },
    totals: { rides: 11, ridden_seconds: 19_570, distance_km: 133.6 },
    classes: [hiit],
    achievements: [],
    ...change,
  } as ProgressReport;
}

describe('progress view (L2-086)', () => {
  it('asks to extend the streak, or to ride again once ridden today', () => {
    expect(rideLabel({ current: 3, best: 6, rode_today: false })).toBe('Ride to make it 4');
    expect(rideLabel({ current: 0, best: 6, rode_today: false })).toBe('Ride to make it 1');
    expect(rideLabel({ current: 4, best: 6, rode_today: true })).toBe('Ride again');
  });

  it('compares only classes with two or more attempts', () => {
    const once: ClassAttempts = { class_id: 'x', title: 'X', attempts: [attempt('b1', 4)] };
    expect(comparable([once, hiit])).toEqual([hiit]);
  });

  it('writes the power trend: latest, change since the first, chart and labels', () => {
    const view = trendView(hiit, 'power', 'UTC');
    expect(view).toEqual(
      expect.objectContaining({
        label: 'Average power across 3 attempts at HIIT: from 145 W to 153 W',
        value: '153',
        unit: 'W',
        change: '+8 W',
        tone: 'better',
        since: ' since your first ride on 3 Nov · 3 rides',
      }),
    );
    expect(view.gridlines.map((g) => g.text)).toEqual(['158', '150', '142']);
    expect(view.points.map((p) => [p.label, p.x, p.latest])).toEqual([
      ['3 Nov: 145 W', 0, false],
      ['9 Nov: 155 W', 50, false],
      ['17 Nov: 153 W', 100, true],
    ]);
    expect(view.points[0]!.y).toBeCloseTo(81.25);
    expect(view.xLabels.map((l) => l.text)).toEqual(['3 Nov', '9 Nov', '17 Nov']);
  });

  it('writes a fall with a minus sign and as worse', () => {
    const view = trendView(
      { ...hiit, attempts: [hiit.attempts[1]!, hiit.attempts[2]!] },
      'on-target',
      'UTC',
    );
    expect(view.change).toBe('−2%');
    expect(view.tone).toBe('worse');
    expect(view.value + view.unit).toBe('97%');
    expect(view.points[0]!.label).toBe('9 Nov: 99%');
  });

  it('counts dips down as better, and no change as same', () => {
    expect(trendView(hiit, 'dips', 'UTC')).toEqual(
      expect.objectContaining({
        label: 'Cadence dips across 3 attempts at HIIT: from 9 dips to 1 dip',
        value: '1',
        unit: 'dip',
        change: '8 fewer',
        tone: 'better',
      }),
    );
    const worse = trendView({ ...hiit, attempts: [hiit.attempts[1]!, hiit.attempts[2]!] }, 'dips');
    expect(worse.change).toBe('1 more');
    const same = trendView({ ...hiit, attempts: [hiit.attempts[2]!, hiit.attempts[2]!] }, 'dips');
    expect(same.change).toBe('No change');
    expect(same.tone).toBe('same');
  });

  it('keeps the on-target axis within 0 to 100', () => {
    const full = trendView(
      {
        ...hiit,
        attempts: [
          attempt('c1', 1, { on_target_pct: 100 }),
          attempt('c2', 2, { on_target_pct: 100 }),
        ],
      },
      'on-target',
    );
    expect(full.gridlines.map((g) => g.text)).toEqual(['100', '100', '99']);
  });

  it('writes a session row with its short date, time and Ended early', () => {
    expect(
      sessionRow(attempt('d1', 16, { ridden_seconds: 1110, completed: false }), 'UTC'),
    ).toEqual({
      id: 'd1',
      date: 'Mon 16 Nov',
      title: 'HIIT',
      early: true,
      time: '18:30',
      avgPower: '150',
      onTarget: '90%',
      dips: 2,
    });
  });

  it('warns to ride today and says how many days beat the best', () => {
    const view = streakView(progress());
    expect(view).toEqual(
      expect.objectContaining({
        current: 3,
        unit: 'days',
        best: 6,
        message: 'Ride today to keep it alive.',
        atRisk: true,
        beat: ' 4 more days beats your best.',
        weekRides: 2,
        weekGoal: 4,
        rides: '11 rides',
        rest: ' · 5 h · 134 km',
      }),
    );
    expect(view.days).toHaveLength(42);
    expect(view.days[0]!.label).toBe('Monday 12 Oct, not ridden');
  });

  it("says today's done, a new streak, and nothing to beat at the best", () => {
    expect(streakView(progress({ streak: { current: 5, best: 6, rode_today: true } }))).toEqual(
      expect.objectContaining({
        message: "Today's done. See you tomorrow.",
        atRisk: false,
        beat: ' 2 more days beats your best.',
      }),
    );
    expect(streakView(progress({ streak: { current: 6, best: 6, rode_today: true } })).beat).toBe(
      '',
    );
    const none = streakView(progress({ streak: { current: 0, best: 6, rode_today: false } }));
    expect(none.message).toBe('One ride starts a new streak.');
    expect(none.beat).toBe('');
    expect(streakView(progress({ streak: { current: 1, best: 1, rode_today: true } })).unit).toBe(
      'day',
    );
  });

  it('shows an achievement as a check when unlocked, or its percentage and progress', () => {
    const a: AchievementFigures = {
      id: 'seven-straight',
      title: 'Seven straight',
      detail: 'Ride seven days in a row',
      goal: 7,
      unit: 'days',
      value: 6,
      unlocked: false,
    };
    expect(achievementView(a)).toEqual({
      id: 'seven-straight',
      title: 'Seven straight',
      detail: 'Ride seven days in a row',
      unlocked: false,
      percent: 86,
      progress: '6 / 7 days',
      value: 6,
      goal: 7,
    });
    expect(achievementView({ ...a, unit: 'km', goal: 100, value: 42.7 }).progress).toBe(
      '42 / 100 km',
    );
    expect(achievementView({ ...a, unit: null, goal: 5, value: 1 }).progress).toBe('1 / 5');
    expect(achievementView({ ...a, value: 9, unlocked: true }).percent).toBe(100);
  });

  it('names the library link with the streak, or plainly without one', () => {
    expect(streakLink(progress())).toEqual({
      label: 'Progress, 3-day streak',
      badge: '3d',
      today: false,
    });
    expect(streakLink(progress({ streak: { current: 4, best: 6, rode_today: true } }))).toEqual({
      label: 'Progress, 4-day streak, ridden today',
      badge: '4d',
      today: true,
    });
    expect(streakLink(progress({ streak: { current: 0, best: 6, rode_today: false } }))).toEqual({
      label: 'Progress',
      badge: null,
      today: false,
    });
    expect(streakLink(null).badge).toBeNull();
  });
});
