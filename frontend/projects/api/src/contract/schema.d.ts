// The data shapes the app's contracts speak: the live bike state, workouts and plans, classes,
// sessions and progress. Hand-maintained; the snake_case names and explicit nulls are kept, since
// sessions export and import in this shape.
// Name a type through api-types.ts, never from here.
export interface components {
  schemas: {
    AchievementFigures: {
      id: string;
      title: string;
      detail: string;
      /** Format: int32 */
      goal: number;
      unit: null | string;
      /** Format: double */
      value: number;
      unlocked: boolean;
    };
    /** @enum {unknown} */
    AdapterState: 'unknown' | 'on' | 'off';
    BikeState: {
      ble: components['schemas']['BleState'];
      device: null | string;
      device_label: null | string;
      error: null | string;
      /** Format: int32 */
      resistance: null | number;
      /** Format: int32 */
      target_resistance: null | number;
      workout: null | components['schemas']['WorkoutSnapshot'];
      /** Format: int32 */
      cadence: null | number;
      /** Format: double */
      speed_kmh: null | number;
      /** Format: double */
      speed_mph: null | number;
      /** Format: int32 */
      packets: number;
      /** Format: double */
      first_data_at: null | number;
      /** Format: double */
      last_data_at: null | number;
      /** Format: double */
      displayed_since: null | number;
      /** Format: double */
      displayed_seconds: number;
      adapter: components['schemas']['AdapterState'];
      simulated: boolean;
      connection_id: string;
      /** Format: int32 */
      power: null | number;
      /** Format: int32 */
      target_power: null | number;
      /** Format: int32 */
      avg_power: null | number;
      /** Format: double */
      distance_km: null | number;
      /** Format: int32 */
      kcal: null | number;
      /** Format: int32 */
      heart_rate: null | number;
      commands: components['schemas']['CommandEntry'][];
    };
    /** @enum {unknown} */
    BleState: 'starting' | 'scanning' | 'connecting' | 'connected' | 'disconnected' | 'error';
    ClassAttempts: {
      class_id: string;
      title: string;
      attempts: components['schemas']['SessionSummary'][];
    };
    ClassCatalogueResponse: {
      shelves: components['schemas']['ClassShelfResponse'][];
    };
    ClassResponse: {
      id: string;
      title: string;
      channel: string;
      focus: string;
      description: string;
      shelf: components['schemas']['ShelfRef'];
      plan: components['schemas']['WorkoutPlan'];
      /** The World Ride scene the class is ridden in, or null. */
      world:
        | null
        | 'docklands'
        | 'granite'
        | 'oldtown'
        | 'prairie'
        | 'dolomites'
        | 'coast'
        | 'caribana'
        | 'westminster'
        | 'centralpark'
        | 'southbeach'
        | 'ghent'
        | 'blackpool';
    };
    ClassShelfResponse: {
      id: string;
      title: string;
      tagline: string;
      classes: components['schemas']['ClassResponse'][];
    };
    CommandEntry: {
      /** Format: double */
      at: number;
      /** Format: int32 */
      ride_seconds: null | number;
      /** Format: int32 */
      level: number;
      source: components['schemas']['CommandSource'];
      status: components['schemas']['CommandStatus'];
      /** Format: int32 */
      ack_ms: null | number;
    };
    /** @enum {unknown} */
    CommandSource: 'plan' | 'manual';
    /** @enum {unknown} */
    CommandStatus: 'sending' | 'ack' | 'failed';
    Dip: {
      /** Format: int32 */
      start: number;
      /** Format: int32 */
      duration: number;
      /** Format: int32 */
      target: number;
      /** Format: int32 */
      low: number;
      kind: components['schemas']['SegmentKind'];
      /** Format: int32 */
      round: null | number;
    };
    IntervalSet: {
      /** Format: int32 */
      rounds: number;
      /** Format: int32 */
      work_seconds: number;
      /** Format: int32 */
      work_level: number;
      /** Format: int32 */
      work_cadence: number;
      /** Format: int32 */
      rest_seconds: number;
      /** Format: int32 */
      rest_level: number;
      /** Format: int32 */
      rest_cadence: number;
    };
    PowerTrace: {
      samples: number[][];
    };
    ProgressReport: {
      /** Format: date */
      today: string;
      streak: components['schemas']['StreakFigures'];
      ride_days: string[];
      week: components['schemas']['WeekFigures'];
      totals: components['schemas']['TotalFigures'];
      classes: components['schemas']['ClassAttempts'][];
      achievements: components['schemas']['AchievementFigures'][];
    };
    /** @enum {unknown} */
    ResistanceMode: 'plan' | 'manual';
    RideVideo: {
      video_id: string;
      /** Format: double */
      start_seconds: number;
    };
    RideVideoLink: {
      url: string;
      /** Format: double */
      start_seconds: number;
    };
    Segment: {
      kind: components['schemas']['SegmentKind'];
      /** Format: int32 */
      start: number;
      /** Format: int32 */
      duration: number;
      /** Format: int32 */
      level: number;
      /** Format: int32 */
      cadence: number;
      /** Format: int32 */
      round: null | number;
    };
    /** @enum {unknown} */
    SegmentKind: 'warmup' | 'work' | 'rest' | 'cooldown' | 'steady';
    SessionDetail: {
      previous: null | components['schemas']['SessionSummary'];
      bests: string[];
      id: string;
      /** Format: date-time */
      ended_at: string;
      class_id: null | string;
      title: string;
      plan: components['schemas']['WorkoutPlan'];
      segments: components['schemas']['Segment'][];
      /** Format: int32 */
      planned_seconds: number;
      /** Format: int32 */
      ridden_seconds: number;
      completed: boolean;
      /** Format: int32 */
      avg_power: number;
      /** Format: int32 */
      max_power: number;
      /** Format: int32 */
      best_minute_power: number;
      /** Format: int32 */
      avg_cadence: number;
      /** Format: double */
      distance_km: number;
      /** Format: int32 */
      kcal: number;
      /** Format: int32 */
      on_target_pct: number;
      dips: components['schemas']['Dip'][];
      power_trace: number[];
      cadence_trace: number[];
    };
    SessionList: {
      sessions: components['schemas']['SessionSummary'][];
    };
    SessionSummary: {
      id: string;
      /** Format: date-time */
      ended_at: string;
      class_id: null | string;
      title: string;
      /** Format: int32 */
      ridden_seconds: number;
      /** Format: int32 */
      planned_seconds: number;
      completed: boolean;
      /** Format: int32 */
      avg_power: number;
      /** Format: int32 */
      on_target_pct: number;
      /** Format: int32 */
      dip_count: number;
    };
    ShelfRef: {
      id: string;
      title: string;
      tagline: string;
    };
    StreakFigures: {
      /** Format: int32 */
      current: number;
      /** Format: int32 */
      best: number;
      rode_today: boolean;
    };
    Stretch: {
      /** Format: int32 */
      seconds: number;
      /** Format: int32 */
      level: number;
      /** Format: int32 */
      cadence: number;
    };
    TotalFigures: {
      /** Format: int32 */
      rides: number;
      /** Format: int32 */
      ridden_seconds: number;
      /** Format: double */
      distance_km: number;
    };
    WeekFigures: {
      /** Format: int32 */
      rides: number;
      /** Format: int32 */
      goal: number;
    };
    WorkoutPlan:
      | components['schemas']['WorkoutPlanHiitPlan']
      | components['schemas']['WorkoutPlanFlatPlan']
      | components['schemas']['WorkoutPlanIntervalsPlan'];
    WorkoutPlanFlatPlan: {
      /** @enum {string} */
      kind: 'flat';
      /** Format: int32 */
      level: number;
      /** Format: int32 */
      minutes: number;
      /** Format: int32 */
      cadence: number;
      video: null | components['schemas']['RideVideo'];
    };
    WorkoutPlanHiitPlan: {
      /** @enum {string} */
      kind: 'hiit';
      /** Format: int32 */
      rounds: number;
      /** Format: int32 */
      work_seconds: number;
      /** Format: int32 */
      rest_seconds: number;
      /** Format: int32 */
      work_level: number;
      /** Format: int32 */
      rest_level: number;
      warmup: boolean;
      cooldown: boolean;
      video: null | components['schemas']['RideVideo'];
    };
    WorkoutPlanIntervalsPlan: {
      /** @enum {string} */
      kind: 'intervals';
      warmup: null | components['schemas']['Stretch'];
      sets: components['schemas']['IntervalSet'][];
      cooldown: null | components['schemas']['Stretch'];
      video: null | components['schemas']['RideVideo'];
    };
    WorkoutSnapshot: {
      plan: components['schemas']['WorkoutPlan'];
      summary: string;
      segments: components['schemas']['Segment'][];
      /** Format: int32 */
      segment: number;
      /** Format: int32 */
      remaining: number;
      /** Format: int32 */
      elapsed_seconds: number;
      /** Format: int32 */
      total_seconds: number;
      mode: components['schemas']['ResistanceMode'];
      /** Format: int32 */
      plan_level: number;
      /** @enum {string} */
      status:
        | 'waiting for bike'
        | 'running'
        | 'paused'
        | 'paused: bike disconnected'
        | 'ended'
        | 'ended: bike shut off'
        | 'stopped';
      ended_reason: null | string;
      session_id: null | string;
      /** The class the workout was started from, or null. */
      class_id: null | string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
