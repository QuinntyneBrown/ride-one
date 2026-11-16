// The last submitted plan draft per machine, kept in localStorage (L2-029 AC7, L2-072 AC10).
import { Injectable } from '@angular/core';
import { DEFAULT_DRAFT, type PlanDraft, PRESETS } from './plan-form';
import { SafeStorage } from './safe-storage';
import {
  DEFAULT_TREADMILL_DRAFT,
  type TreadmillPlanDraft,
  validateTreadmillDraft,
} from './treadmill-plan-form';

export const PLAN_DRAFT_KEY = 'wattzup.planDraft';
export const TREADMILL_PLAN_DRAFT_KEY = 'wattzup.treadmillPlanDraft';

const TREADMILL_STRINGS = [
  'rounds',
  'work',
  'rest',
  'workSpeed',
  'restSpeed',
  'workIncline',
  'restIncline',
  'speed',
  'incline',
  'minutes',
] as const;

/**
 * Accepts a stored treadmill draft only when every field has the right shape and the draft still
 * validates, so one saved under the old 16.0 km/h and 15 % limits falls back (L2-072 AC10).
 */
export function readTreadmillDraft(raw: string | null): TreadmillPlanDraft {
  if (!raw) return DEFAULT_TREADMILL_DRAFT;
  try {
    const d = JSON.parse(raw) as Partial<TreadmillPlanDraft>;
    const ok =
      (d.mode === 'hiit' || d.mode === 'flat') &&
      TREADMILL_STRINGS.every((k) => typeof d[k] === 'string') &&
      typeof d.warmup === 'boolean' &&
      typeof d.cooldown === 'boolean';
    if (!ok) return DEFAULT_TREADMILL_DRAFT;
    const draft = d as TreadmillPlanDraft;
    const read: TreadmillPlanDraft = {
      mode: draft.mode,
      warmup: draft.warmup,
      cooldown: draft.cooldown,
      ...Object.fromEntries(TREADMILL_STRINGS.map((k) => [k, draft[k]])),
    } as TreadmillPlanDraft;
    return validateTreadmillDraft(read).length === 0 ? read : DEFAULT_TREADMILL_DRAFT;
  } catch {
    return DEFAULT_TREADMILL_DRAFT;
  }
}

const STRINGS = ['rounds', 'work', 'rest', 'minutes', 'cadence'] as const;
const LEVELS = ['workLevel', 'restLevel', 'flatLevel'] as const;

/** Accepts stored data only when every field has the right shape. */
export function readDraft(raw: string | null): PlanDraft {
  if (!raw) return DEFAULT_DRAFT;
  try {
    const d = JSON.parse(raw) as Partial<PlanDraft>;
    const ok =
      (d.mode === 'hiit' || d.mode === 'flat') &&
      (d.preset === null || PRESETS.some((p) => p.id === d.preset)) &&
      STRINGS.every((k) => typeof d[k] === 'string') &&
      LEVELS.every(
        (k) => Number.isInteger(d[k]) && (d[k] as number) >= 1 && (d[k] as number) <= 32,
      ) &&
      typeof d.warmup === 'boolean' &&
      typeof d.cooldown === 'boolean';
    return ok ? (d as PlanDraft) : DEFAULT_DRAFT;
  } catch {
    return DEFAULT_DRAFT;
  }
}

@Injectable({ providedIn: 'root' })
export class PlanDraftStore {
  private readonly storage = new SafeStorage(() => localStorage);

  load(): PlanDraft {
    return readDraft(this.storage.get(PLAN_DRAFT_KEY));
  }

  save(draft: PlanDraft): void {
    this.storage.set(PLAN_DRAFT_KEY, JSON.stringify(draft));
  }

  loadTreadmill(): TreadmillPlanDraft {
    return readTreadmillDraft(this.storage.get(TREADMILL_PLAN_DRAFT_KEY));
  }

  saveTreadmill(draft: TreadmillPlanDraft): void {
    this.storage.set(TREADMILL_PLAN_DRAFT_KEY, JSON.stringify(draft));
  }
}
