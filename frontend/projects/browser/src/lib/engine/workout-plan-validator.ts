// Mirrors Wattzup.Core/Workouts/WorkoutPlanValidator.cs: checks a plan as POST /api/workout takes
// it, naming every failing field with the API's message (L2-010, L2-045, L2-097 AC6).
import type { IntervalSet, RideVideo, Stretch, WorkoutPlan } from '@wattzup/api';
import { roundAwayFromZero } from './rounding';
import { parseYouTubeId } from './youtube-link';

export const CHOOSE_KIND = 'Choose HIIT, Intervals or Flat.';
export const WHOLE_NUMBER = 'Enter a whole number.';
export const ON_OR_OFF = 'Choose on or off.';
export const LEVEL_RANGE = 'Level must be 1 to 32.';
export const SET_COUNT = 'Enter 1 to 10 sets.';
export const ROUNDS_RANGE = 'Enter 1 to 30 rounds.';
export const CADENCE_AIM_RANGE = 'Cadence aim must be 40 to 150 rpm.';
export const RECOVER_RANGE = 'Recover must be 0 (none) or at least 0:05.';
export const TOO_MANY_EFFORTS = 'At most 30 efforts in a plan.';
export const TOO_LONG = 'A ride can be at most 180 minutes.';
export const VIDEO_LINK = "That doesn't look like a YouTube link.";
export const VIDEO_START = 'Start point must be 0:00 to 12:00:00.';
export const MAX_START_SECONDS = 43200;
export const MAX_SETS = 10;
export const MAX_EFFORTS = 30;
export const MAX_RIDE_SECONDS = 180 * 60;

export type ValidationErrors = Record<string, string[]>;
export interface PlanValidationResult {
  plan: WorkoutPlan | null;
  errors: ValidationErrors;
}

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

export function validatePlan(body: unknown): PlanValidationResult {
  const errors: ValidationErrors = {};
  const kind = isObject(body) && typeof body['kind'] === 'string' ? body['kind'] : null;
  let plan: WorkoutPlan | null = null;
  if (isObject(body)) {
    if (kind === 'hiit') plan = hiit(body, errors);
    else if (kind === 'flat') plan = flat(body, errors);
    else if (kind === 'intervals') plan = intervals(body, errors);
  }
  if (kind !== 'hiit' && kind !== 'flat' && kind !== 'intervals') errors['kind'] = [CHOOSE_KIND];
  const video = isObject(body) ? rideVideo(body, errors) : null;
  if (plan && video) plan = { ...plan, video };
  return Object.keys(errors).length === 0 ? { plan, errors } : { plan: null, errors };
}

function rideVideo(body: Json, errors: ValidationErrors): RideVideo | null {
  const video = body['video'];
  if (video === undefined || video === null) return null;
  if (!isObject(video)) {
    errors['video.url'] = [VIDEO_LINK];
    return null;
  }
  const id = typeof video['url'] === 'string' ? parseYouTubeId(video['url']) : null;
  if (id === null) errors['video.url'] = [VIDEO_LINK];
  const start = video['start_seconds'];
  const startOk = typeof start === 'number' && start >= 0 && start <= MAX_START_SECONDS;
  if (!startOk) errors['video.start_seconds'] = [VIDEO_START];
  return id !== null && startOk
    ? { video_id: id, start_seconds: roundAwayFromZero(start as number, 1) }
    : null;
}

function hiit(body: Json, errors: ValidationErrors): WorkoutPlan {
  return {
    kind: 'hiit',
    video: null,
    rounds: int(body, 'rounds', errors, 1, 30, ROUNDS_RANGE, ROUNDS_RANGE),
    work_seconds: int(
      body,
      'work_seconds',
      errors,
      5,
      3600,
      'Work must be at least 0:05.',
      'Work must be at most 60:00.',
    ),
    rest_seconds: int(
      body,
      'rest_seconds',
      errors,
      5,
      3600,
      'Recover must be at least 0:05.',
      'Recover must be at most 60:00.',
    ),
    work_level: int(body, 'work_level', errors, 1, 32, LEVEL_RANGE, LEVEL_RANGE),
    rest_level: int(body, 'rest_level', errors, 1, 32, LEVEL_RANGE, LEVEL_RANGE),
    warmup: bool(body, 'warmup', errors),
    cooldown: bool(body, 'cooldown', errors),
  };
}

function flat(body: Json, errors: ValidationErrors): WorkoutPlan {
  const cadence = 'Cadence goal must be 40 to 150 rpm.';
  return {
    kind: 'flat',
    video: null,
    level: int(body, 'level', errors, 1, 32, LEVEL_RANGE, LEVEL_RANGE),
    minutes: int(
      body,
      'minutes',
      errors,
      1,
      180,
      'Enter 1 to 180 minutes.',
      'Enter 1 to 180 minutes.',
    ),
    cadence: int(body, 'cadence', errors, 40, 150, cadence, cadence),
  };
}

function intervals(body: Json, errors: ValidationErrors): WorkoutPlan | null {
  const warmup = optionalStretch(body, 'warmup', 'Warm-up must be 1:00 to 30:00.', errors);
  const cooldown = optionalStretch(body, 'cooldown', 'Cool-down must be 1:00 to 30:00.', errors);
  const setsJson = body['sets'];
  if (!Array.isArray(setsJson) || setsJson.length === 0 || setsJson.length > MAX_SETS) {
    errors['sets'] = [SET_COUNT];
    return null;
  }
  const sets: IntervalSet[] = [];
  setsJson.forEach((set: unknown, i) => {
    const path = `sets[${i}].`;
    if (!isObject(set)) {
      errors[`sets[${i}]`] = [WHOLE_NUMBER];
      return;
    }
    const count = Object.keys(errors).length;
    const parsed: IntervalSet = {
      rounds: int(set, 'rounds', errors, 1, 30, ROUNDS_RANGE, ROUNDS_RANGE, path),
      work_seconds: int(
        set,
        'work_seconds',
        errors,
        5,
        3600,
        'Work must be at least 0:05.',
        'Work must be at most 60:00.',
        path,
      ),
      work_level: int(set, 'work_level', errors, 1, 32, LEVEL_RANGE, LEVEL_RANGE, path),
      work_cadence: int(
        set,
        'work_cadence',
        errors,
        40,
        150,
        CADENCE_AIM_RANGE,
        CADENCE_AIM_RANGE,
        path,
      ),
      rest_seconds: rest(set, errors, path),
      rest_level: int(set, 'rest_level', errors, 1, 32, LEVEL_RANGE, LEVEL_RANGE, path),
      rest_cadence: int(
        set,
        'rest_cadence',
        errors,
        40,
        150,
        CADENCE_AIM_RANGE,
        CADENCE_AIM_RANGE,
        path,
      ),
    };
    if (Object.keys(errors).length === count) sets.push(parsed);
  });
  if (Object.keys(errors).length > 0) return null;
  const efforts = sets.reduce((n, s) => n + s.rounds, 0);
  const seconds =
    (warmup?.seconds ?? 0) +
    (cooldown?.seconds ?? 0) +
    sets.reduce((n, s) => n + s.rounds * (s.work_seconds + s.rest_seconds), 0);
  if (efforts > MAX_EFFORTS) errors['sets'] = [TOO_MANY_EFFORTS];
  else if (seconds > MAX_RIDE_SECONDS) errors['sets'] = [TOO_LONG];
  return { kind: 'intervals', video: null, warmup, sets, cooldown };
}

function rest(set: Json, errors: ValidationErrors, path: string): number {
  const value = int(
    set,
    'rest_seconds',
    errors,
    0,
    3600,
    RECOVER_RANGE,
    'Recover must be at most 60:00.',
    path,
  );
  if (value > 0 && value < 5) errors[path + 'rest_seconds'] = [RECOVER_RANGE];
  return value;
}

function optionalStretch(
  body: Json,
  field: string,
  secondsRange: string,
  errors: ValidationErrors,
): Stretch | null {
  const value = body[field];
  if (value === undefined || (value !== null && !isObject(value))) {
    errors[field] = [ON_OR_OFF];
    return null;
  }
  if (value === null) return null;
  const path = field + '.';
  return {
    seconds: int(value, 'seconds', errors, 60, 1800, secondsRange, secondsRange, path),
    level: int(value, 'level', errors, 1, 32, LEVEL_RANGE, LEVEL_RANGE, path),
    cadence: int(value, 'cadence', errors, 40, 150, CADENCE_AIM_RANGE, CADENCE_AIM_RANGE, path),
  };
}

function int(
  body: Json,
  field: string,
  errors: ValidationErrors,
  min: number,
  max: number,
  tooLow: string,
  tooHigh: string,
  path = '',
): number {
  const value = body[field];
  if (typeof value !== 'number' || !Number.isInteger(value) || Math.abs(value) > 2_147_483_647) {
    errors[path + field] = [WHOLE_NUMBER];
    return 0;
  }
  if (value < min) errors[path + field] = [tooLow];
  else if (value > max) errors[path + field] = [tooHigh];
  return value;
}

function bool(body: Json, field: string, errors: ValidationErrors): boolean {
  const value = body[field];
  if (typeof value === 'boolean') return value;
  errors[field] = [ON_OR_OFF];
  return false;
}
