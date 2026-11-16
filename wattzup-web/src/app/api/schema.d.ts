/**
 * Stand-in for the file `openapi-typescript` generates from /openapi/v1.json.
 *
 * `npm run generate:api` overwrites this file with the generated one. It mirrors the
 * L2-014 state contract and the endpoint bodies, using the schema names of the backend
 * types (BikeState, WorkoutSnapshot, Segment, CommandEntry, HiitPlan, FlatPlan).
 * Nothing imports this file except src/app/core/api-types.ts.
 */

export type paths = Record<string, never>;
export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    BikeState: {
      ble: 'starting' | 'scanning' | 'connecting' | 'connected' | 'disconnected' | 'error';
      device: string | null;
      device_label: string | null;
      error: string | null;
      resistance: number | null;
      target_resistance: number | null;
      workout: components['schemas']['WorkoutSnapshot'] | null;
      cadence: number | null;
      speed_kmh: number | null;
      speed_mph: number | null;
      packets: number;
      first_data_at: number | null;
      last_data_at: number | null;
      ui_clients: number;
      displayed_since: number | null;
      displayed_seconds: number;
      adapter: 'unknown' | 'on' | 'off';
      transport: string;
      simulated: boolean;
      exposed: boolean;
      bind_address: string;
      connection_id: string;
      power: number | null;
      target_power: number | null;
      avg_power: number | null;
      distance_km: number | null;
      kcal: number | null;
      heart_rate: number | null;
      commands: components['schemas']['CommandEntry'][];
      /** Stream messages only. */
      ts?: number;
    };
    WorkoutSnapshot: {
      plan: components['schemas']['HiitPlan'] | components['schemas']['FlatPlan'];
      summary: string;
      segments: components['schemas']['Segment'][];
      segment: number;
      remaining: number;
      elapsed_seconds: number;
      total_seconds: number;
      mode: 'plan' | 'manual';
      plan_level: number;
      status:
        | 'waiting for bike'
        | 'running'
        | 'paused'
        | 'paused: bike disconnected'
        | 'ended'
        | 'ended: bike shut off'
        | 'stopped';
      ended_reason: string | null;
    };
    Segment: {
      kind: 'warmup' | 'work' | 'rest' | 'cooldown' | 'steady';
      start: number;
      duration: number;
      level: number;
      cadence: number;
      round: number | null;
    };
    CommandEntry: {
      at: number;
      ride_seconds: number | null;
      level: number;
      source: 'plan' | 'manual';
      status: 'sending' | 'ack' | 'failed';
      ack_ms: number | null;
    };
    HiitPlan: {
      kind: 'hiit';
      rounds: number;
      work_seconds: number;
      rest_seconds: number;
      work_level: number;
      rest_level: number;
      warmup: boolean;
      cooldown: boolean;
    };
    FlatPlan: {
      kind: 'flat';
      level: number;
      minutes: number;
      cadence: number;
    };
    SetResistanceRequest: { level: number };
    SetResistanceResponse: { sent: number };
    StartWorkoutResponse: { started: components['schemas']['WorkoutSnapshot'] };
    StopWorkoutResponse: { stopped: boolean };
    WorkoutResponse: { workout: components['schemas']['WorkoutSnapshot'] };
    PowerTrace: { samples: [number, number][] };
    PacketLines: { lines: string[] };
    EventToken: { token: string };
    ProblemDetails: {
      type?: string | null;
      title?: string | null;
      status?: number | null;
      detail?: string | null;
      code?: string | null;
      error?: string | null;
      errors?: Record<string, string[]> | null;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
