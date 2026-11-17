// The Intervals draft's rules for the setup screen and its dialogs (L2-010 AC11-13, L2-029 AC11-15).
import type { IntervalSet, IntervalsPlan } from '@wattzup/api';
import { WARMUP_CADENCE, WORK_CADENCE, REST_CADENCE, COOLDOWN_CADENCE } from './plan-expansion';
import { formatClock, parseClock, parseUnit } from './plan-form';

export type IntervalPresetId = 'descending' | 'even';
export type StretchKind = 'warmup' | 'cooldown';

/** A warm-up or cool-down; turning it off keeps its values for when it is turned on again. */
export interface StretchDraft {
  on: boolean;
  seconds: number;
  level: number;
  cadence: number;
}

/** One set, in the API's numbers. */
export type SetDraft = IntervalSet;

export interface IntervalsDraft {
  preset: IntervalPresetId | null;
  warmup: StretchDraft;
  sets: SetDraft[];
  cooldown: StretchDraft;
}

/** A plan rule broken by the whole plan, for the form summary (L2-029 AC15). */
export interface PlanRuleError {
  message: string;
  link: string;
}

export const MAX_SETS = 10;
export const MAX_EFFORTS = 30;
export const MAX_RIDE_SECONDS = 180 * 60;

const set = (rounds: number, work: number, workLevel: number, rest: number, restLevel: number) => ({
  rounds,
  work_seconds: work,
  work_level: workLevel,
  work_cadence: WORK_CADENCE,
  rest_seconds: rest,
  rest_level: restLevel,
  rest_cadence: REST_CADENCE,
});

export const INTERVAL_PRESETS: readonly {
  id: IntervalPresetId;
  label: string;
  draft: Omit<IntervalsDraft, 'preset'>;
}[] = [
  {
    id: 'descending',
    label: 'Descending recoveries',
    draft: {
      warmup: { on: true, seconds: 300, level: 8, cadence: WARMUP_CADENCE },
      sets: [
        set(1, 30, 28, 180, 8),
        set(2, 30, 28, 150, 8),
        set(2, 30, 28, 120, 8),
        set(2, 30, 28, 90, 8),
        set(1, 30, 28, 0, 8),
      ],
      cooldown: { on: true, seconds: 360, level: 6, cadence: COOLDOWN_CADENCE },
    },
  },
  {
    id: 'even',
    label: 'Even sets',
    draft: {
      warmup: { on: true, seconds: 180, level: 8, cadence: WARMUP_CADENCE },
      sets: [set(4, 40, 26, 20, 12), set(4, 40, 26, 20, 12), set(4, 40, 26, 20, 12)],
      cooldown: { on: true, seconds: 120, level: 6, cadence: COOLDOWN_CADENCE },
    },
  },
];

export function applyIntervalPreset(draft: IntervalsDraft, id: IntervalPresetId): IntervalsDraft {
  const preset = INTERVAL_PRESETS.find((p) => p.id === id);
  return preset ? { preset: id, ...structuredClone(preset.draft) } : draft;
}

/** The *Descending recoveries* plan with its preset pressed (L2-029 AC11). */
export const DEFAULT_INTERVALS: IntervalsDraft = {
  preset: 'descending',
  ...structuredClone(INTERVAL_PRESETS[0].draft),
};

const edited = (draft: IntervalsDraft, change: Partial<IntervalsDraft>): IntervalsDraft => ({
  ...draft,
  ...change,
  preset: null,
});

export function addSet(draft: IntervalsDraft, added: SetDraft): IntervalsDraft {
  if (draft.sets.length >= MAX_SETS) return draft;
  return edited(draft, { sets: [...draft.sets, added] });
}

/** Removes set `i`; the last set left stays. */
export function removeSet(draft: IntervalsDraft, i: number): IntervalsDraft {
  if (draft.sets.length <= 1) return draft;
  return edited(draft, { sets: draft.sets.filter((_, j) => j !== i) });
}

/** Moves set `i` one place up (-1) or down (1); unchanged at either end. */
export function moveSet(draft: IntervalsDraft, i: number, dir: 1 | -1): IntervalsDraft {
  const j = i + dir;
  if (j < 0 || j >= draft.sets.length) return draft;
  const sets = [...draft.sets];
  [sets[i], sets[j]] = [sets[j], sets[i]];
  return edited(draft, { sets });
}

export function replaceSet(draft: IntervalsDraft, i: number, next: SetDraft): IntervalsDraft {
  return edited(draft, { sets: draft.sets.map((s, j) => (j === i ? next : s)) });
}

export function setStretch(
  draft: IntervalsDraft,
  kind: StretchKind,
  stretch: StretchDraft,
): IntervalsDraft {
  return edited(draft, { [kind]: stretch });
}

export function effortsOf(draft: IntervalsDraft): number {
  return draft.sets.reduce((sum, s) => sum + s.rounds, 0);
}

function secondsOf(draft: IntervalsDraft): number {
  const stretch = (s: StretchDraft): number => (s.on ? s.seconds : 0);
  return (
    stretch(draft.warmup) +
    stretch(draft.cooldown) +
    draft.sets.reduce((sum, s) => sum + s.rounds * (s.work_seconds + s.rest_seconds), 0)
  );
}

/** The plan rules of L2-010 criterion 13. */
export function validateIntervals(draft: IntervalsDraft): PlanRuleError[] {
  if (effortsOf(draft) > MAX_EFFORTS) {
    return [{ message: 'At most 30 efforts in a plan.', link: 'Sets — at most 30 efforts' }];
  }
  if (secondsOf(draft) > MAX_RIDE_SECONDS) {
    return [{ message: 'A ride can be at most 180 minutes.', link: 'Sets — at most 180 minutes' }];
  }
  return [];
}

export function toIntervalsPlan(draft: IntervalsDraft): IntervalsPlan | null {
  if (validateIntervals(draft).length > 0) return null;
  const stretch = ({ on, seconds, level, cadence }: StretchDraft) =>
    on ? { seconds, level, cadence } : null;
  return {
    kind: 'intervals',
    video: null,
    warmup: stretch(draft.warmup),
    sets: draft.sets.map((s) => ({ ...s })),
    cooldown: stretch(draft.cooldown),
  };
}

/** `5:00 · Level 8 · 80 rpm` (L2-029 AC12). */
export function stretchLine(s: StretchDraft): string {
  return `${formatClock(s.seconds)} · Level ${s.level} · ${s.cadence} rpm`;
}

/** `2 × 0:30 · L28 · 100 rpm` and `Recover 2:30 · L8 · 72 rpm` or `No recover` (L2-029 AC12). */
export function setLines(s: SetDraft): { work: string; rest: string } {
  return {
    work: `${s.rounds} × ${formatClock(s.work_seconds)} · L${s.work_level} · ${s.work_cadence} rpm`,
    rest:
      s.rest_seconds > 0
        ? `Recover ${formatClock(s.rest_seconds)} · L${s.rest_level} · ${s.rest_cadence} rpm`
        : 'No recover',
  };
}

// ----- The Edit set dialog (L2-029 AC13) --------------------------------------------------------

/** The Edit set dialog's fields as typed. */
export interface SetFields {
  rounds: string;
  work: string;
  rest: string;
  workLevel: number;
  restLevel: number;
  workCadence: string;
  restCadence: string;
}

export type SetField = 'rounds' | 'work' | 'rest' | 'workCadence' | 'restCadence';

const NONE = 'None';
const rpm = (n: number): string => `${n} rpm`;
const formatRest = (n: number): string => (n === 0 ? NONE : formatClock(n));
/** `None` or a clock; `0:00` reads as none too. */
const parseRest = (text: string): number | null =>
  text.trim().toLowerCase() === NONE.toLowerCase() ? 0 : parseClock(text);

export function setFieldsOf(s: SetDraft): SetFields {
  return {
    rounds: String(s.rounds),
    work: formatClock(s.work_seconds),
    rest: formatRest(s.rest_seconds),
    workLevel: s.work_level,
    restLevel: s.rest_level,
    workCadence: rpm(s.work_cadence),
    restCadence: rpm(s.rest_cadence),
  };
}

interface SetRule {
  parse: (text: string) => number | null;
  format: (n: number) => string;
  min: number;
  max: number;
  step: number;
  message: (n: number) => string | null;
}

const cadenceRule: SetRule = {
  parse: parseUnit,
  format: rpm,
  min: 40,
  max: 150,
  step: 5,
  message: (n) => (n < 40 || n > 150 ? 'Cadence aim must be 40 to 150 rpm.' : null),
};

const SET_RULES: Record<SetField, SetRule> = {
  rounds: {
    parse: parseUnit,
    format: String,
    min: 1,
    max: 30,
    step: 1,
    message: (n) => (n < 1 || n > 30 ? 'Enter 1 to 30 rounds.' : null),
  },
  work: {
    parse: parseClock,
    format: formatClock,
    min: 5,
    max: 3600,
    step: 5,
    message: (n) =>
      n < 5 ? 'Work must be at least 0:05.' : n > 3600 ? 'Work must be at most 60:00.' : null,
  },
  rest: {
    parse: parseRest,
    format: formatRest,
    min: 0,
    max: 3600,
    step: 5,
    message: (n) =>
      n > 0 && n < 5
        ? 'Recover must be 0 (none) or at least 0:05.'
        : n > 3600
          ? 'Recover must be at most 60:00.'
          : null,
  },
  workCadence: cadenceRule,
  restCadence: cadenceRule,
};

const SET_FIELDS = Object.keys(SET_RULES) as SetField[];

/** The message of each failing field (L2-010 AC12). */
export function validateSet(fields: SetFields): Partial<Record<SetField, string>> {
  const errors: Partial<Record<SetField, string>> = {};
  for (const field of SET_FIELDS) {
    const n = SET_RULES[field].parse(fields[field]);
    const message = n === null ? 'Enter a whole number.' : SET_RULES[field].message(n);
    if (message) errors[field] = message;
  }
  return errors;
}

export function toSetDraft(fields: SetFields): SetDraft | null {
  if (Object.keys(validateSet(fields)).length > 0) return null;
  const n = (field: SetField): number => SET_RULES[field].parse(fields[field]) as number;
  return {
    rounds: n('rounds'),
    work_seconds: n('work'),
    work_level: fields.workLevel,
    work_cadence: n('workCadence'),
    rest_seconds: n('rest'),
    rest_level: fields.restLevel,
    rest_cadence: n('restCadence'),
  };
}

/** Less (-1) or More (+1): Rounds by 1, times and cadences by 5; Recover reaches None. */
export function stepSetField(fields: SetFields, field: SetField, dir: 1 | -1): SetFields {
  const rule = SET_RULES[field];
  const current = rule.parse(fields[field]) ?? rule.min;
  const next = Math.min(rule.max, Math.max(rule.min, current + dir * rule.step));
  // Recover steps between None and 0:05; nothing in between is allowed.
  const value = field === 'rest' && next > 0 && next < 5 ? (dir > 0 ? 5 : 0) : next;
  return { ...fields, [field]: rule.format(value) };
}

// ----- The Warm-up and Cool-down dialog (L2-029 AC14) -------------------------------------------

export interface StretchFields {
  duration: string;
  level: number;
  cadence: string;
}

export type StretchField = 'duration' | 'cadence';

export function stretchFieldsOf(s: StretchDraft): StretchFields {
  return { duration: formatClock(s.seconds), level: s.level, cadence: rpm(s.cadence) };
}

export const STRETCH_NAMES: Record<StretchKind, string> = {
  warmup: 'Warm-up',
  cooldown: 'Cool-down',
};

export function validateStretch(
  kind: StretchKind,
  fields: StretchFields,
): Partial<Record<StretchField, string>> {
  const errors: Partial<Record<StretchField, string>> = {};
  const seconds = parseClock(fields.duration);
  if (seconds === null) errors.duration = 'Enter a whole number.';
  else if (seconds < 60 || seconds > 1800) {
    errors.duration = `${STRETCH_NAMES[kind]} must be 1:00 to 30:00.`;
  }
  const cadence = parseUnit(fields.cadence);
  const message = cadence === null ? 'Enter a whole number.' : cadenceRule.message(cadence);
  if (message) errors.cadence = message;
  return errors;
}

export function toStretch(
  fields: StretchFields,
  on: boolean,
  kind: StretchKind = 'warmup',
): StretchDraft | null {
  if (Object.keys(validateStretch(kind, fields)).length > 0) return null;
  return {
    on,
    seconds: parseClock(fields.duration) as number,
    level: fields.level,
    cadence: parseUnit(fields.cadence) as number,
  };
}

/** Less (-1) or More (+1): Duration by 0:30 within 1:00 to 30:00, Cadence aim by 5 rpm. */
export function stepStretchField(
  fields: StretchFields,
  field: StretchField,
  dir: 1 | -1,
): StretchFields {
  if (field === 'cadence') {
    const current = parseUnit(fields.cadence) ?? cadenceRule.min;
    return { ...fields, cadence: rpm(Math.min(150, Math.max(40, current + dir * 5))) };
  }
  const current = parseClock(fields.duration) ?? 60;
  return { ...fields, duration: formatClock(Math.min(1800, Math.max(60, current + dir * 30))) };
}
