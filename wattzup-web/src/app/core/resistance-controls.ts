// The resistance panel's rules (L2-020, L2-047).
import type { BikeState } from './api-types';

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 32;
const DEFAULT_LEVEL = 12;

export function baseLevel(state: BikeState | null): number {
  return state?.resistance ?? state?.target_resistance ?? DEFAULT_LEVEL;
}

export function stepLevel(state: BikeState | null, delta: 1 | -1): number {
  return Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, baseLevel(state) + delta));
}

export interface ControlsState {
  lowerDisabled: boolean;
  raiseDisabled: boolean;
  pickerDisabled: boolean;
}

export function controlsState(state: BikeState | null, commandsEnabled: boolean): ControlsState {
  if (!commandsEnabled) return { lowerDisabled: true, raiseDisabled: true, pickerDisabled: true };
  const level = baseLevel(state);
  return {
    lowerDisabled: level <= MIN_LEVEL,
    raiseDisabled: level >= MAX_LEVEL,
    pickerDisabled: false,
  };
}

export interface PlanNote {
  text: string;
  backToPlan: boolean;
}

export function planNote(state: BikeState | null): PlanNote {
  const w = state?.workout;
  if (!w) return { text: 'Manual control — no plan is running.', backToPlan: false };
  const flat = w.plan.kind === 'flat';
  if (w.mode === 'manual') {
    return {
      text: flat
        ? `Manual level. Plan was ${w.plan_level}.`
        : 'Manual level. Plan takes over next interval.',
      backToPlan: true,
    };
  }
  return {
    text: flat
      ? 'Holding a flat level for the whole ride.'
      : 'Following the plan — levels change with each interval.',
    backToPlan: false,
  };
}
