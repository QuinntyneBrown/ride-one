// Builders for unit tests: a full L2-014 state, mid-ride on the default plan.
import type { BikeState, WorkoutSnapshot } from './api-types';
import { expandPlan } from './plan-expansion';

export function testWorkout(change: Partial<WorkoutSnapshot> = {}): WorkoutSnapshot {
  const plan = {
    kind: 'hiit',
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
  return {
    plan,
    summary: 'HIIT · 8 × 40s / 20s',
    segments: expandPlan(plan),
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
}

export function testState(change: Partial<BikeState> = {}): BikeState {
  return {
    ble: 'connected',
    device: 'ECHEX-3-141844',
    device_label: 'Echelon EX-5s',
    error: null,
    resistance: 18,
    target_resistance: 18,
    workout: testWorkout(),
    cadence: 95,
    speed_kmh: 25.1,
    speed_mph: 15.6,
    packets: 2517,
    first_data_at: 1794785000,
    last_data_at: 1794787812,
    ui_clients: 1,
    displayed_since: 1794785322,
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
    commands: [],
    machine: 'bike',
    target_speed: null,
    incline: null,
    target_incline: null,
    belt: null,
    belt_countdown: null,
    ...change,
  };
}
