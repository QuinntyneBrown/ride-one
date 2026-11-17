// Stub states in the L2-014 contract. Each builder starts from a response recorded from the
// backend running with --simulate (recorded/, `npm run record:api`) and lays the mocks' cast on
// top: Echelon EX-5s mid-ride on the default 8 × 40s / 20s plan at 7:07. A cast field the
// backend does not send fails the test, so the stubs cannot drift from the contract.
import recordedRunning from './recorded/status-running.json';
import recordedStarted from './recorded/workout-started.json';
import recordedTreadmillRunning from './recorded/status-treadmill-running.json';
import recordedVideoStarted from './recorded/video-workout-started.json';

export type Json = Record<string, unknown>;

/** The recorded response with `cast` laid over it; throws on a field the recording lacks. */
export function fromRecording<T extends Json>(recorded: T, cast: Json, what: string): T {
  for (const key of Object.keys(cast)) {
    if (!(key in recorded)) {
      throw new Error(
        `Stub ${what} sets "${key}", which the backend does not send. Re-record with npm run record:api.`,
      );
    }
  }
  return { ...recorded, ...cast };
}

function sameShape(recorded: Json, items: Json[], what: string): Json[] {
  return items.map((item) => fromRecording(recorded, item, what));
}

const RECORDED_STATE = recordedRunning as unknown as Json;
const RECORDED_WORKOUT = recordedStarted.started as unknown as Json;
const RECORDED_SEGMENT = recordedStarted.started.segments[0] as unknown as Json;
const RECORDED_COMMAND = recordedRunning.commands[0] as unknown as Json;
const RECORDED_NEARBY = recordedRunning.nearby[0] as unknown as Json;

export const DEFAULT_PLAN = {
  kind: 'hiit',
  video: null,
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
} as const;

/** The plan the setup form starts with on first use (L2-029 AC1). */
export const SETUP_DEFAULT_PLAN = {
  ...DEFAULT_PLAN,
  rounds: 18,
  work_level: 26,
  rest_level: 18,
} as const;

/** The Descending recoveries plan, as the Intervals form posts it on first use (L2-029 AC11). */
export const INTERVALS_PLAN = {
  kind: 'intervals',
  video: null,
  warmup: { seconds: 300, level: 8, cadence: 80 },
  sets: [180, 150, 120, 90, 0].map((rest_seconds, i) => ({
    rounds: i === 0 || i === 4 ? 1 : 2,
    work_seconds: 30,
    work_level: 28,
    work_cadence: 100,
    rest_seconds,
    rest_level: 8,
    rest_cadence: 72,
  })),
  cooldown: { seconds: 360, level: 6, cadence: 70 },
};

export const FLAT_PLAN = {
  kind: 'flat',
  video: null,
  level: 12,
  minutes: 30,
  cadence: 85,
  speed: null,
  incline: null,
} as const;

export const DEFAULT_SEGMENTS = sameShape(
  RECORDED_SEGMENT,
  [
    { kind: 'warmup', start: 0, duration: 180, level: 8, cadence: 80, round: null },
    { kind: 'work', start: 180, duration: 40, level: 18, cadence: 98, round: 1 },
    { kind: 'rest', start: 220, duration: 20, level: 6, cadence: 72, round: 1 },
    { kind: 'work', start: 240, duration: 40, level: 18, cadence: 98, round: 2 },
    { kind: 'rest', start: 280, duration: 20, level: 6, cadence: 72, round: 2 },
    { kind: 'work', start: 300, duration: 40, level: 18, cadence: 98, round: 3 },
    { kind: 'rest', start: 340, duration: 20, level: 6, cadence: 72, round: 3 },
    { kind: 'work', start: 360, duration: 40, level: 18, cadence: 98, round: 4 },
    { kind: 'rest', start: 400, duration: 20, level: 6, cadence: 72, round: 4 },
    { kind: 'work', start: 420, duration: 40, level: 18, cadence: 98, round: 5 },
    { kind: 'rest', start: 460, duration: 20, level: 6, cadence: 72, round: 5 },
    { kind: 'work', start: 480, duration: 40, level: 18, cadence: 98, round: 6 },
    { kind: 'rest', start: 520, duration: 20, level: 6, cadence: 72, round: 6 },
    { kind: 'work', start: 540, duration: 40, level: 18, cadence: 98, round: 7 },
    { kind: 'rest', start: 580, duration: 20, level: 6, cadence: 72, round: 7 },
    { kind: 'work', start: 600, duration: 40, level: 18, cadence: 98, round: 8 },
    { kind: 'cooldown', start: 640, duration: 120, level: 6, cadence: 70, round: null },
  ],
  'segment',
);

/** Default plan, work round 5 of 8, 0:33 left, 7:07 of 12:40. */
export function workout(change: Json = {}): Json {
  const cast = {
    plan: DEFAULT_PLAN,
    summary: 'HIIT · 8 × 40s / 20s',
    segments: DEFAULT_SEGMENTS,
    segment: 9,
    remaining: 33,
    elapsed_seconds: 427,
    total_seconds: 760,
    mode: 'plan',
    plan_level: 18,
    status: 'running',
    ended_reason: null,
    ...change,
  };
  return fromRecording(RECORDED_WORKOUT, cast, 'workout');
}

/** The ride-along video of a plan, as the backend reports it (L2-014). */
export const RIDE_VIDEO = recordedVideoStarted.started.plan.video;

/** The default plan with the GCN video synced from 0:12.0 (L2-076). */
export function videoWorkout(change: Json = {}): Json {
  return workout({ plan: { ...DEFAULT_PLAN, video: RIDE_VIDEO }, ...change });
}

export function flatWorkout(change: Json = {}): Json {
  return workout({
    plan: FLAT_PLAN,
    summary: 'Flat · Level 12 · 30 min',
    segments: [
      {
        kind: 'steady',
        start: 0,
        duration: 1800,
        level: 12,
        cadence: 85,
        round: null,
        speed: null,
        incline: null,
      },
    ],
    segment: 0,
    remaining: 938,
    elapsed_seconds: 862,
    total_seconds: 1800,
    plan_level: 12,
    ...change,
  });
}

/** Today in the mocks is 2026-11-15, about 7:10 PM (UTC in the tests). */
export const NOW = Date.UTC(2026, 10, 15, 19, 10, 12);
export const NOW_S = NOW / 1000;

export function state(change: Json = {}): Json {
  const cast = {
    // Treadmill support is off by default (L2-075); treadmill states turn it on.
    treadmill_enabled: false,
    ble: 'connected',
    device: 'ECHEX-3-141844',
    device_label: 'Echelon EX-5s',
    error: null,
    resistance: 18,
    target_resistance: 18,
    workout: workout(),
    cadence: 95,
    speed_kmh: 25.1,
    speed_mph: 15.6,
    packets: 2517,
    first_data_at: NOW_S - 2700,
    last_data_at: NOW_S,
    ui_clients: 2,
    displayed_since: NOW_S - 2490,
    displayed_seconds: 2490,
    adapter: 'on',
    transport: 'Simulated',
    simulated: false,
    exposed: false,
    bind_address: '127.0.0.1:8787',
    connection_id: '0bf669f1',
    power: 317,
    target_power: 327,
    avg_power: 208,
    distance_km: 2.53,
    kcal: 89,
    heart_rate: null,
    commands: sameShape(
      RECORDED_COMMAND,
      [
        {
          at: NOW_S - 6,
          ride_seconds: 421,
          level: 18,
          source: 'plan',
          status: 'ack',
          ack_ms: 40,
          value: 18,
        },
        {
          at: NOW_S - 27,
          ride_seconds: 400,
          level: 6,
          source: 'plan',
          status: 'ack',
          ack_ms: 34,
          value: 6,
        },
        {
          at: NOW_S - 67,
          ride_seconds: 360,
          level: 18,
          source: 'plan',
          status: 'ack',
          ack_ms: 41,
          value: 18,
        },
      ],
      'command',
    ),
    ...change,
  };
  return fromRecording(RECORDED_STATE, cast, 'state');
}

/** Connected with no workout: a free ride. */
export function freeRide(change: Json = {}): Json {
  return state({
    workout: null,
    resistance: 8,
    target_resistance: 8,
    cadence: 72,
    power: 96,
    target_power: null,
    avg_power: 0,
    distance_km: 0,
    kcal: 0,
    speed_kmh: 0,
    speed_mph: 0,
    commands: [],
    ...change,
  });
}

/** The backend's initial state (L2-014 AC1). */
export function startingState(change: Json = {}): Json {
  return state({
    ble: 'starting',
    device: null,
    device_label: null,
    resistance: null,
    target_resistance: null,
    workout: null,
    cadence: null,
    speed_kmh: null,
    speed_mph: null,
    packets: 0,
    first_data_at: null,
    last_data_at: null,
    ui_clients: 0,
    displayed_since: null,
    displayed_seconds: 0,
    adapter: 'unknown',
    power: null,
    target_power: null,
    avg_power: null,
    distance_km: null,
    kcal: null,
    commands: [],
    ...change,
  });
}

/** The bike-only fields, null on the treadmill (L2-070). */
const BIKE_FIELDS_NULL = {
  resistance: null,
  target_resistance: null,
  cadence: null,
  power: null,
  target_power: null,
  avg_power: null,
  kcal: null,
};

/** The treadmill connected and idle, belt stopped, no workout (L2-062, L2-070). */
export function treadmillIdle(change: Json = {}): Json {
  return state({
    ...BIKE_FIELDS_NULL,
    treadmill_enabled: true,
    machine: 'treadmill',
    device: 'STRIDE-8s22-000766',
    device_label: 'STRIDE-8s22-000766',
    workout: null,
    speed_kmh: 0,
    speed_mph: 0,
    distance_km: 0,
    target_speed: null,
    incline: 0,
    target_incline: null,
    belt: 'stopped',
    belt_countdown: null,
    climb_m: null,
    nearby: [],
    commands: [],
    ...change,
  });
}

/** The treadmill setup default: 18 × 0:40 / 0:20 at 9.0 / 7.0 km/h, incline 0 (L2-072 AC4). */
export const TREADMILL_PLAN = {
  kind: 'hiit',
  video: null,
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

function treadmillSegments(): Json[] {
  const segments: Json[] = [];
  let start = 0;
  const push = (kind: string, duration: number, speed: number, round: number | null) => {
    segments.push({ kind, start, duration, level: null, cadence: null, round, speed, incline: 0 });
    start += duration;
  };
  push('warmup', 180, 7, null);
  for (let round = 1; round <= 18; round++) {
    push('work', 40, 9, round);
    if (round < 18) push('rest', 20, 7, round);
  }
  push('cooldown', 120, 7, null);
  return sameShape(RECORDED_SEGMENT, segments, 'treadmill segment');
}

/** The treadmill plan, work round 5 of 18, 0:33 left, 7:07 of 22:40. */
export function treadmillWorkout(change: Json = {}): Json {
  return workout({
    plan: TREADMILL_PLAN,
    summary: 'HIIT · 18 × 40s / 20s',
    segments: treadmillSegments(),
    segment: 9,
    remaining: 33,
    elapsed_seconds: 427,
    total_seconds: 1360,
    plan_level: null,
    ...change,
  });
}

const RECORDED_TREADMILL_COMMAND = recordedTreadmillRunning.commands[0] as unknown as Json;

/** A treadmill command entry: `SPD 9.0` or `INC 0` (L2-065). */
export function treadmillCommand(change: Json): Json {
  return fromRecording(
    RECORDED_TREADMILL_COMMAND,
    { level: null, source: 'plan', status: 'ack', ...change },
    'treadmill command',
  );
}

/** The treadmill mid-ride at 9.0 km/h, incline 0, as the treadmill mocks show (L2-071). */
export function treadmillState(change: Json = {}): Json {
  return treadmillIdle({
    workout: treadmillWorkout(),
    speed_kmh: 9,
    speed_mph: 5.6,
    target_speed: 9,
    incline: 0,
    target_incline: 0,
    distance_km: 0.92,
    climb_m: 0,
    kcal: 98,
    belt: 'running',
    commands: [
      treadmillCommand({
        at: NOW_S - 7,
        ride_seconds: 420,
        command: 'incline',
        value: 0,
        ack_ms: 46,
      }),
      treadmillCommand({
        at: NOW_S - 7,
        ride_seconds: 420,
        command: 'speed',
        value: 9,
        ack_ms: 612,
      }),
      treadmillCommand({
        at: NOW_S - 27,
        ride_seconds: 400,
        command: 'incline',
        value: 0,
        ack_ms: 44,
      }),
      treadmillCommand({
        at: NOW_S - 27,
        ride_seconds: 400,
        command: 'speed',
        value: 7,
        ack_ms: 588,
      }),
      treadmillCommand({
        at: NOW_S - 67,
        ride_seconds: 360,
        command: 'incline',
        value: 0,
        ack_ms: 47,
      }),
    ],
    ...change,
  });
}

/** One `nearby` entry (L2-074): the recorded shape with `change` laid over it. */
export function nearbyEntry(machine: 'bike' | 'treadmill', change: Json = {}): Json {
  const cast: Json =
    machine === 'bike'
      ? { machine, name: 'ECHEX-3-141844', label: 'Echelon EX-5s', rssi: -68, signal: 3 }
      : { machine, name: 'STRIDE-8s22-000766', label: 'Echelon Stride', rssi: -55, signal: 4 };
  return fromRecording(RECORDED_NEARBY, { ...cast, seen_at: NOW_S, ...change }, 'nearby entry');
}

/** The machine page's state: treadmill support on, the bike chosen and connected, no workout, both
 * machines nearby. */
export function machinePageState(change: Json = {}): Json {
  return freeRide({
    treadmill_enabled: true,
    nearby: [nearbyEntry('bike'), nearbyEntry('treadmill')],
    ...change,
  });
}
