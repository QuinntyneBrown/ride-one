// The last submitted plan draft, kept in localStorage (L2-029 AC7).
import { Injectable } from '@angular/core';
import { DEFAULT_DRAFT, type PlanDraft, PRESETS } from './plan-form';
import { SafeStorage } from './safe-storage';

export const PLAN_DRAFT_KEY = 'wattzup.planDraft';

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
}
