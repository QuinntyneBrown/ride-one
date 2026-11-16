// The treadmill plan draft's rules for the setup screen (L2-072, L2-067 messages). Rounds, Work,
// Recover and Duration follow the bike's rules in plan-form.ts (L2-010).
import type { WorkoutPlan } from './api-types';
import {
  DEFAULT_DRAFT,
  type DraftError,
  type DraftField,
  type PlanDraft,
  type PresetId,
  applyPreset,
  parseClock,
  parseUnit,
  stepDraft,
  validateDraft,
} from './plan-form';

export const MIN_SPEED = 1.0;
export const MAX_SPEED = 16.0;
export const SPEED_STEP = 0.5;
export const MIN_INCLINE = 0;
export const MAX_INCLINE = 15;
export const INCLINE_STEP = 1;

export const SPEED_RANGE = 'Speed must be 1.0 to 16.0 km/h.';
export const SPEED_FORMAT = 'Enter a speed like 9.0.';
export const INCLINE_RANGE = 'Incline must be 0 to 15 %.';
export const WHOLE_NUMBER = 'Enter a whole number.';

export interface TreadmillPlanDraft {
  mode: 'hiit' | 'flat';
  preset: PresetId | null;
  rounds: string;
  work: string;
  rest: string;
  workSpeed: string;
  restSpeed: string;
  workIncline: string;
  restIncline: string;
  warmup: boolean;
  cooldown: boolean;
  speed: string;
  incline: string;
  minutes: string;
}

export type TreadmillField =
  | 'rounds'
  | 'work'
  | 'rest'
  | 'workSpeed'
  | 'restSpeed'
  | 'workIncline'
  | 'restIncline'
  | 'speed'
  | 'incline'
  | 'minutes';

export interface TreadmillDraftError {
  field: TreadmillField;
  message: string;
  link: string;
}

export const DEFAULT_TREADMILL_DRAFT: TreadmillPlanDraft = {
  mode: 'hiit',
  preset: null,
  rounds: '18',
  work: '0:40',
  rest: '0:20',
  workSpeed: '9.0',
  restSpeed: '7.0',
  workIncline: '0',
  restIncline: '0',
  warmup: true,
  cooldown: true,
  speed: '7.0',
  incline: '0',
  minutes: '30 min',
};

type SpeedField = 'workSpeed' | 'restSpeed' | 'speed';
type InclineField = 'workIncline' | 'restIncline' | 'incline';
type SharedField = 'rounds' | 'work' | 'rest' | 'minutes';

const SPEED_LINKS: Record<SpeedField, string> = {
  workSpeed: 'Work speed — 1.0 to 16.0 km/h',
  restSpeed: 'Recover speed — 1.0 to 16.0 km/h',
  speed: 'Speed — 1.0 to 16.0 km/h',
};
const INCLINE_LINKS: Record<InclineField, string> = {
  workIncline: 'Work incline — 0 to 15 %',
  restIncline: 'Recover incline — 0 to 15 %',
  incline: 'Incline — 0 to 15 %',
};

const HIIT_FIELDS: TreadmillField[] = [
  'rounds',
  'work',
  'rest',
  'workSpeed',
  'restSpeed',
  'workIncline',
  'restIncline',
];
const FLAT_FIELDS: TreadmillField[] = ['speed', 'incline', 'minutes'];

const isSpeed = (f: TreadmillField): f is SpeedField => f in SPEED_LINKS;
const isIncline = (f: TreadmillField): f is InclineField => f in INCLINE_LINKS;

/** `9.0`, `9`, `9.0 km/h` → 9; more than one decimal or other text → null. */
export function parseSpeed(text: string): number | null {
  const m = /^\s*(\d{1,3}(?:\.\d)?)\s*(?:km\/h)?\s*$/i.exec(text);
  return m ? Number(m[1]) : null;
}

/** `2`, `2 %`, `-1` → the whole number; other text → null. */
export function parseIncline(text: string): number | null {
  const m = /^\s*(-?\d{1,3})\s*%?\s*$/.exec(text);
  return m ? Number(m[1]) : null;
}

export function formatSpeed(speed: number): string {
  return speed.toFixed(1);
}

/** The bike draft carrying the shared fields, so their rules and messages are the bike's. */
function asBikeDraft(draft: TreadmillPlanDraft): PlanDraft {
  return {
    ...DEFAULT_DRAFT,
    mode: draft.mode,
    preset: draft.preset,
    rounds: draft.rounds,
    work: draft.work,
    rest: draft.rest,
    minutes: draft.minutes,
  };
}

export function treadmillFieldsOf(mode: TreadmillPlanDraft['mode']): TreadmillField[] {
  return mode === 'hiit' ? HIIT_FIELDS : FLAT_FIELDS;
}

export function validateTreadmillDraft(draft: TreadmillPlanDraft): TreadmillDraftError[] {
  const shared = new Map<DraftField, DraftError>(
    validateDraft(asBikeDraft(draft)).map((e) => [e.field, e]),
  );
  const errors: TreadmillDraftError[] = [];
  for (const field of treadmillFieldsOf(draft.mode)) {
    if (isSpeed(field)) {
      const n = parseSpeed(draft[field]);
      if (n !== null && n >= MIN_SPEED && n <= MAX_SPEED) continue;
      errors.push({
        field,
        message: n === null ? SPEED_FORMAT : SPEED_RANGE,
        link: SPEED_LINKS[field],
      });
    } else if (isIncline(field)) {
      const n = parseIncline(draft[field]);
      if (n !== null && n >= MIN_INCLINE && n <= MAX_INCLINE) continue;
      errors.push({
        field,
        message: n === null ? WHOLE_NUMBER : INCLINE_RANGE,
        link: INCLINE_LINKS[field],
      });
    } else {
      const e = shared.get(field);
      if (e) errors.push({ field, message: e.message, link: e.link });
    }
  }
  return errors;
}

/** Applies an edit; editing Rounds, Work or Recover clears the pressed preset. */
export function editTreadmillDraft(
  draft: TreadmillPlanDraft,
  change: Partial<TreadmillPlanDraft>,
): TreadmillPlanDraft {
  const clears = 'rounds' in change || 'work' in change || 'rest' in change;
  return { ...draft, ...change, ...(clears ? { preset: null } : {}) };
}

export function applyTreadmillPreset(draft: TreadmillPlanDraft, id: PresetId): TreadmillPlanDraft {
  const filled = applyPreset(asBikeDraft(draft), id);
  return {
    ...draft,
    preset: filled.preset,
    rounds: filled.rounds,
    work: filled.work,
    rest: filled.rest,
  };
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/** Less (-1) or More (+1): speeds by 0.5 km/h, inclines by 1 %, the rest as stepDraft (L2-072 AC6). */
export function stepTreadmillDraft(
  draft: TreadmillPlanDraft,
  field: TreadmillField,
  dir: 1 | -1,
): TreadmillPlanDraft {
  if (isSpeed(field)) {
    const base = parseSpeed(draft[field]) ?? (parseSpeed(DEFAULT_TREADMILL_DRAFT[field]) as number);
    const next = clamp(Math.round((base + dir * SPEED_STEP) * 10) / 10, MIN_SPEED, MAX_SPEED);
    return editTreadmillDraft(draft, { [field]: formatSpeed(next) });
  }
  if (isIncline(field)) {
    const base =
      parseIncline(draft[field]) ?? (parseIncline(DEFAULT_TREADMILL_DRAFT[field]) as number);
    const next = clamp(base + dir * INCLINE_STEP, MIN_INCLINE, MAX_INCLINE);
    return editTreadmillDraft(draft, { [field]: String(next) });
  }
  const stepped = stepDraft(asBikeDraft(draft), field as SharedField, dir);
  return editTreadmillDraft(draft, { [field]: stepped[field as SharedField] });
}

export function toTreadmillPlan(draft: TreadmillPlanDraft): WorkoutPlan | null {
  if (validateTreadmillDraft(draft).length > 0) return null;
  if (draft.mode === 'flat') {
    return {
      kind: 'flat',
      level: null,
      minutes: parseUnit(draft.minutes) as number,
      cadence: null,
      speed: parseSpeed(draft.speed) as number,
      incline: parseIncline(draft.incline) as number,
    };
  }
  return {
    kind: 'hiit',
    rounds: parseUnit(draft.rounds) as number,
    work_seconds: parseClock(draft.work) as number,
    rest_seconds: parseClock(draft.rest) as number,
    work_level: null,
    rest_level: null,
    warmup: draft.warmup,
    cooldown: draft.cooldown,
    work_speed: parseSpeed(draft.workSpeed) as number,
    rest_speed: parseSpeed(draft.restSpeed) as number,
    work_incline: parseIncline(draft.workIncline) as number,
    rest_incline: parseIncline(draft.restIncline) as number,
  };
}
