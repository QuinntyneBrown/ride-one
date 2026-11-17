// What the resistance readout and level picker show (L2-019).
import type { BikeState } from './api-types';

export interface ResistanceView {
  valueText: string;
  settingText: string | null;
  litUpTo: number;
  pressedLevel: number | null;
  planLevel: number | null;
}

export function resistanceView(state: BikeState | null): ResistanceView {
  const resistance = state?.resistance ?? null;
  const target = state?.target_resistance ?? null;
  const w = state?.workout;
  return {
    valueText: resistance === null ? '--' : String(resistance),
    settingText: target !== null && target !== resistance ? `Setting ${target}…` : null,
    litUpTo: resistance ?? 0,
    pressedLevel: target ?? resistance,
    planLevel: w && w.mode === 'manual' ? w.plan_level : null,
  };
}
