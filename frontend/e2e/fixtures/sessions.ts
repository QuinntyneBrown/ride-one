// Stub sessions and progress in the L2-083 contract. Each builder starts from a response recorded
// from the backend running with --simulate (a one-minute ride of 30 Minute HIIT Cardio) and lays
// the mocks' cast on top: the class ridden to its end on Wednesday 18 Nov at 18:10, the day after
// the previous attempt. A cast field the backend does not send fails the test.
import recordedSession from './recorded/session.json';
import recordedSessions from './recorded/sessions.json';
import recordedProgress from './recorded/progress.json';
import { fromRecording, type Json } from './states';

const RECORDED_SESSION = recordedSession as unknown as Json;
const RECORDED_SUMMARY = recordedSessions.sessions[0] as unknown as Json;
const RECORDED_PROGRESS = recordedProgress as unknown as Json;
const RECORDED_ACHIEVEMENT = recordedProgress.achievements[0] as unknown as Json;

/** The 30 Minute HIIT Cardio segments, as the backend expands them: 30:00. */
export const HIIT_SEGMENTS = recordedSession.segments;

export const SESSION_ID = 'fa03e5b7c9d1';
export const PREVIOUS_ID = 'ebf2d4e1adbb';

/** Cadence on the aim of each counted segment, power by kind, one value per 5 s. */
function traces(seconds: number): { cadence: number[]; power: number[] } {
  const cadence: number[] = [];
  const power: number[] = [];
  for (let t = 0; t < seconds; t += 5) {
    const seg = HIIT_SEGMENTS.find((s) => t >= s.start && t < s.start + s.duration)!;
    cadence.push(seg.cadence ?? 80);
    power.push(seg.kind === 'work' ? 400 : 120);
  }
  return { cadence, power };
}

/** A session summary (the list's row), 30 Minute HIIT Cardio, finished. */
export function sessionSummary(change: Json = {}): Json {
  return fromRecording(
    RECORDED_SUMMARY,
    {
      id: PREVIOUS_ID,
      ended_at: '2026-11-17T18:10:00+00:00',
      class_id: '30-minute-hiit-cardio',
      title: '30 Minute HIIT Cardio',
      ridden_seconds: 1800,
      planned_seconds: 1800,
      completed: true,
      avg_power: 153,
      on_target_pct: 97,
      dip_count: 1,
      ...change,
    },
    'session summary',
  );
}

export const THREE_DIPS = [
  { start: 697, duration: 15, target: 98, low: 86, kind: 'work', round: 3 },
  { start: 1027, duration: 13, target: 98, low: 87, kind: 'work', round: 5 },
  { start: 1418, duration: 14, target: 98, low: 85, kind: 'work', round: 8 },
];

/** The session the Session Summary mock shows: 156 W, +3 W on 17 Nov, three dips. */
export function sessionDetail(change: Json = {}): Json {
  const ridden = (change['ridden_seconds'] as number | undefined) ?? 1800;
  const { cadence, power } = traces(ridden);
  return fromRecording(
    RECORDED_SESSION,
    {
      id: SESSION_ID,
      ended_at: '2026-11-18T18:10:00+00:00',
      class_id: '30-minute-hiit-cardio',
      title: '30 Minute HIIT Cardio',
      planned_seconds: 1800,
      ridden_seconds: ridden,
      completed: true,
      avg_power: 156,
      max_power: 453,
      best_minute_power: 290,
      avg_cadence: 78,
      distance_km: 12.84,
      kcal: 280,
      on_target_pct: 96,
      dips: THREE_DIPS,
      power_trace: power,
      cadence_trace: cadence,
      previous: sessionSummary(),
      bests: ['Best average on this class'],
      ...change,
    },
    'session',
  );
}

function achievement(
  id: string,
  title: string,
  detail: string,
  goal: number,
  unit: string | null,
  value: number,
): Json {
  return fromRecording(
    RECORDED_ACHIEVEMENT,
    { id, title, detail, goal, unit, value, unlocked: value >= goal },
    'achievement',
  );
}

/** Progress on Wednesday 18 Nov before riding: 11 rides, streak 3, best 6, 2 of 4 this week. */
export function progressReport(change: Json = {}): Json {
  return fromRecording(
    RECORDED_PROGRESS,
    {
      today: '2026-11-18',
      streak: { current: 3, best: 6, rode_today: false },
      ride_days: [
        '2026-11-03',
        '2026-11-05',
        '2026-11-08',
        '2026-11-09',
        '2026-11-10',
        '2026-11-11',
        '2026-11-12',
        '2026-11-13',
        '2026-11-15',
        '2026-11-16',
        '2026-11-17',
      ],
      week: { rides: 2, goal: 4 },
      totals: { rides: 11, ridden_seconds: 19_570, distance_km: 133.24 },
      classes: [
        {
          class_id: '30-minute-hiit-cardio',
          title: '30 Minute HIIT Cardio',
          attempts: [
            sessionSummary({
              id: 'a1c3e5f70911',
              ended_at: '2026-11-03T07:10:00+00:00',
              avg_power: 145,
              on_target_pct: 86,
              dip_count: 9,
            }),
            sessionSummary({
              id: 'd4f6b8ca3c44',
              ended_at: '2026-11-09T18:05:00+00:00',
              avg_power: 149,
              on_target_pct: 94,
              dip_count: 4,
            }),
            sessionSummary({
              id: 'a7c9ebfd6f77',
              ended_at: '2026-11-12T07:05:00+00:00',
              avg_power: 153,
              on_target_pct: 97,
              dip_count: 1,
            }),
            sessionSummary({
              id: 'c9ebf2bf8b99',
              ended_at: '2026-11-15T07:25:00+00:00',
              avg_power: 155,
              on_target_pct: 99,
              dip_count: 0,
            }),
            sessionSummary(),
          ],
        },
        {
          class_id: '20-minute-power-intervals',
          title: '20 Minute Power Intervals',
          attempts: [
            sessionSummary({
              id: 'b2d4f6a81a22',
              ended_at: '2026-11-05T18:20:00+00:00',
              class_id: '20-minute-power-intervals',
              title: '20 Minute Power Intervals',
              ridden_seconds: 1200,
              planned_seconds: 1200,
              avg_power: 198,
              on_target_pct: 88,
              dip_count: 3,
            }),
            sessionSummary({
              id: 'e5a7c9db4d55',
              ended_at: '2026-11-10T07:15:00+00:00',
              class_id: '20-minute-power-intervals',
              title: '20 Minute Power Intervals',
              ridden_seconds: 1200,
              planned_seconds: 1200,
              avg_power: 205,
              on_target_pct: 89,
              dip_count: 2,
            }),
          ],
        },
        {
          class_id: '20-min-threshold-builder',
          title: '20 Min Threshold Builder',
          attempts: [
            sessionSummary({
              id: 'f6b8daec5e66',
              ended_at: '2026-11-11T18:30:00+00:00',
              class_id: '20-min-threshold-builder',
              title: '20 Min Threshold Builder',
            }),
          ],
        },
      ],
      achievements: [
        achievement('century', 'Century', 'Ride 100 km in total', 100, 'km', 133.24),
        achievement(
          'interval-regular',
          'Interval regular',
          'Finish eight interval rides',
          8,
          null,
          8,
        ),
        achievement('metronome', 'Metronome', 'Hold cadence target 97% of a ride', 97, '%', 99),
        achievement(
          'clean-sheet',
          'Clean sheet',
          'Finish an interval ride with no cadence dips',
          1,
          null,
          1,
        ),
        achievement('seven-straight', 'Seven straight', 'Ride seven days in a row', 7, 'days', 6),
        achievement(
          'long-hour',
          'The long hour',
          'Finish five rides of an hour or more',
          5,
          null,
          1,
        ),
      ],
      ...change,
    },
    'progress',
  );
}

/** Progress after riding on Wednesday 18 Nov: streak 4, 3 of 4 this week. */
export function progressAfterRide(change: Json = {}): Json {
  const before = progressReport();
  return progressReport({
    streak: { current: 4, best: 6, rode_today: true },
    ride_days: [...(before['ride_days'] as string[]), '2026-11-18'],
    week: { rides: 3, goal: 4 },
    ...change,
  });
}

/** The newest-first list behind Progress: 11 sessions. */
export function sessionList(): Json {
  const rows = [
    sessionSummary(),
    sessionSummary({
      id: 'daf1c3d09caa',
      ended_at: '2026-11-16T18:00:00+00:00',
      class_id: null,
      title: 'HIIT · 8 × 0:30 / 1:30',
      ridden_seconds: 1110,
      planned_seconds: 1380,
      completed: false,
      avg_power: 168,
      on_target_pct: 97,
      dip_count: 1,
    }),
    sessionSummary({
      id: 'c9ebf2bf8b99',
      ended_at: '2026-11-15T07:25:00+00:00',
      avg_power: 155,
      on_target_pct: 99,
      dip_count: 0,
    }),
    sessionSummary({
      id: 'b8daf1ae7a88',
      ended_at: '2026-11-13T18:45:00+00:00',
      class_id: '30-min-tempo-paceline',
      title: '30 Min Tempo Paceline',
      ridden_seconds: 1120,
      planned_seconds: 2160,
      completed: false,
      avg_power: 255,
      on_target_pct: 100,
      dip_count: 0,
    }),
    sessionSummary({
      id: 'a7c9ebfd6f77',
      ended_at: '2026-11-12T07:05:00+00:00',
      avg_power: 153,
      on_target_pct: 97,
      dip_count: 1,
    }),
    sessionSummary({
      id: 'f6b8daec5e66',
      ended_at: '2026-11-11T18:30:00+00:00',
      class_id: '20-min-threshold-builder',
      title: '20 Min Threshold Builder',
      ridden_seconds: 1200,
      planned_seconds: 1200,
      avg_power: 226,
      on_target_pct: 86,
      dip_count: 4,
    }),
    sessionSummary({
      id: 'e5a7c9db4d55',
      ended_at: '2026-11-10T07:15:00+00:00',
      class_id: '20-minute-power-intervals',
      title: '20 Minute Power Intervals',
      ridden_seconds: 1200,
      planned_seconds: 1200,
      avg_power: 205,
      on_target_pct: 89,
      dip_count: 2,
    }),
    sessionSummary({
      id: 'd4f6b8ca3c44',
      ended_at: '2026-11-09T18:05:00+00:00',
      avg_power: 149,
      on_target_pct: 94,
      dip_count: 4,
    }),
    sessionSummary({
      id: 'c3e5a7b92b33',
      ended_at: '2026-11-08T07:40:00+00:00',
      class_id: '60-min-dolomites-endurance',
      title: '60 Min Dolomites Endurance',
      ridden_seconds: 3600,
      planned_seconds: 3600,
      avg_power: 150,
      on_target_pct: 92,
      dip_count: 2,
    }),
    sessionSummary({
      id: 'b2d4f6a81a22',
      ended_at: '2026-11-05T18:20:00+00:00',
      class_id: '20-minute-power-intervals',
      title: '20 Minute Power Intervals',
      ridden_seconds: 1200,
      planned_seconds: 1200,
      avg_power: 198,
      on_target_pct: 88,
      dip_count: 3,
    }),
    sessionSummary({
      id: 'a1c3e5f70911',
      ended_at: '2026-11-03T07:10:00+00:00',
      avg_power: 145,
      on_target_pct: 86,
      dip_count: 9,
    }),
  ];
  return { sessions: rows };
}
