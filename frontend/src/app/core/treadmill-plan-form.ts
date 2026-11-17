// The treadmill plan draft's rules for the setup screen (L2-072, L2-067 messages). Rounds, Work,
// Recover and Duration follow the bike's rules in plan-form.ts (L2-010).
import type { WorkoutPlan } from './api-types';
import {
  DEFAULT_DRAFT,
  type DraftError,
  type DraftField,
  type PlanDraft,
  parseClock,
  parseUnit,
  stepDraft,
  validateDraft,
} from './plan-form';

/** The Echelon Stride's limits (L2-065, L2-067). */
export const MIN_SPEED = 0.8;
export const MAX_SPEED = 19.3;
export const SPEED_STEP = 0.5;
export const MIN_INCLINE = 0;
export const MAX_INCLINE = 10;
export const INCLINE_STEP = 1;
const MINUTES_STEP = 5;
const MIN_MINUTES = 1;
const MAX_MINUTES = 180;

export const SPEED_RANGE = 'Speed must be 0.8 to 19.3 km/h.';
export const SPEED_FORMAT = 'Enter a speed like 9.0.';
export const INCLINE_RANGE = 'Incline must be 0 to 10 %.';
export const WHOLE_NUMBER = 'Enter a whole number.';

export interface TreadmillPlanDraft {
  mode: 'hiit' | 'flat';
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

export type TreadmillPresetId =
  | 'sprints-30-30'
  | 'minute-on'
  | 'hill-repeats'
  | 'norwegian-4x4'
  | 'hill-walk'
  | 'easy-run'
  | 'tempo';

/** A preset and the draft values it sets (L2-072 AC3). */
export interface TreadmillPreset {
  id: TreadmillPresetId;
  label: string;
  mode: TreadmillPlanDraft['mode'];
  values: Partial<TreadmillPlanDraft>;
}

const hiit = (
  id: TreadmillPresetId,
  label: string,
  rounds: number,
  work: string,
  rest: string,
  workSpeed: string,
  restSpeed: string,
  workIncline: number,
  restIncline: number,
): TreadmillPreset => ({
  id,
  label,
  mode: 'hiit',
  values: {
    rounds: String(rounds),
    work,
    rest,
    workSpeed,
    restSpeed,
    workIncline: String(workIncline),
    restIncline: String(restIncline),
  },
});

const steady = (
  id: TreadmillPresetId,
  label: string,
  speed: string,
  incline: number,
  minutes: number,
): TreadmillPreset => ({
  id,
  label,
  mode: 'flat',
  values: { speed, incline: String(incline), minutes: String(minutes) },
});

export const TREADMILL_PRESETS: readonly TreadmillPreset[] = [
  hiit('sprints-30-30', 'Sprints 30/30', 10, '0:30', '0:30', '15.0', '5.5', 1, 0),
  hiit('minute-on', 'Minute on', 6, '1:00', '1:00', '13.0', '6.0', 2, 1),
  hiit('hill-repeats', 'Hill repeats', 6, '1:30', '1:30', '9.0', '5.5', 8, 0),
  hiit('norwegian-4x4', 'Norwegian 4×4', 4, '4:00', '3:00', '12.5', '6.0', 3, 1),
  steady('hill-walk', 'Hill walk', '6.5', 8, 30),
  steady('easy-run', 'Easy run', '9.5', 1, 30),
  steady('tempo', 'Tempo', '12.5', 1, 20),
];

/** The presets offered for a mode, in order. */
export function presetsFor(mode: TreadmillPlanDraft['mode']): readonly TreadmillPreset[] {
  return TREADMILL_PRESETS.filter((p) => p.mode === mode);
}

/** HIIT with the Minute on values; the Steady fields hold Hill walk's (L2-072 AC4). */
export const DEFAULT_TREADMILL_DRAFT: TreadmillPlanDraft = {
  mode: 'hiit',
  rounds: '6',
  work: '1:00',
  rest: '1:00',
  workSpeed: '13.0',
  restSpeed: '6.0',
  workIncline: '2',
  restIncline: '1',
  warmup: true,
  cooldown: true,
  speed: '6.5',
  incline: '8',
  minutes: '30',
};

type SpeedField = 'workSpeed' | 'restSpeed' | 'speed';
type InclineField = 'workIncline' | 'restIncline' | 'incline';
type SharedField = 'rounds' | 'work' | 'rest';

const SPEED_LINKS: Record<SpeedField, string> = {
  workSpeed: 'Work speed — 0.8 to 19.3 km/h',
  restSpeed: 'Recover speed — 0.8 to 19.3 km/h',
  speed: 'Speed — 0.8 to 19.3 km/h',
};
const INCLINE_LINKS: Record<InclineField, string> = {
  workIncline: 'Work incline — 0 to 10 %',
  restIncline: 'Recover incline — 0 to 10 %',
  incline: 'Incline — 0 to 10 %',
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
    preset: null,
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

export function editTreadmillDraft(
  draft: TreadmillPlanDraft,
  change: Partial<TreadmillPlanDraft>,
): TreadmillPlanDraft {
  return { ...draft, ...change };
}

export function applyTreadmillPreset(
  draft: TreadmillPlanDraft,
  id: TreadmillPresetId,
): TreadmillPlanDraft {
  const p = TREADMILL_PRESETS.find((x) => x.id === id);
  return p ? { ...draft, ...p.values } : draft;
}

/** The parsed value of a field, so `9` matches `9.0` and `60` matches `1:00`. */
function valueOf(field: TreadmillField, text: string): number | null {
  if (isSpeed(field)) return parseSpeed(text);
  if (isIncline(field)) return parseIncline(text);
  if (field === 'work' || field === 'rest') return parseClock(text);
  return parseUnit(text);
}

/** True while every value the preset sets still matches the draft (L2-072 AC3). */
export function presetPressed(draft: TreadmillPlanDraft, id: TreadmillPresetId): boolean {
  const p = TREADMILL_PRESETS.find((x) => x.id === id);
  if (!p || p.mode !== draft.mode) return false;
  return (Object.entries(p.values) as [TreadmillField, string][]).every(([field, text]) => {
    const want = valueOf(field, text);
    return want !== null && valueOf(field, draft[field]) === want;
  });
}

/** Whether Slower (-1) or Faster (+1) can still move a speed (L2-072 AC5). */
export function canStepSpeed(text: string, dir: 1 | -1): boolean {
  const n = parseSpeed(text);
  if (n === null) return true;
  return dir > 0 ? n < MAX_SPEED : n > MIN_SPEED;
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/**
 * Less (-1) or More (+1): speeds by 0.5 km/h within 0.8–19.3, inclines by 1 % within 0–10,
 * Duration by 5 minutes, and Rounds, Work and Recover as stepDraft (L2-072 AC5, AC6).
 */
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
  if (field === 'minutes') {
    const base = parseUnit(draft.minutes) ?? (parseUnit(DEFAULT_TREADMILL_DRAFT.minutes) as number);
    const next = clamp(base + dir * MINUTES_STEP, MIN_MINUTES, MAX_MINUTES);
    return editTreadmillDraft(draft, { minutes: String(next) });
  }
  const stepped = stepDraft(asBikeDraft(draft), field as SharedField, dir);
  return editTreadmillDraft(draft, { [field]: stepped[field as SharedField] });
}

export function toTreadmillPlan(draft: TreadmillPlanDraft): WorkoutPlan | null {
  if (validateTreadmillDraft(draft).length > 0) return null;
  if (draft.mode === 'flat') {
    return {
      kind: 'flat',
      video: null,
      level: null,
      minutes: parseUnit(draft.minutes) as number,
      cadence: null,
      speed: parseSpeed(draft.speed) as number,
      incline: parseIncline(draft.incline) as number,
    };
  }
  return {
    kind: 'hiit',
    video: null,
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
