// What the treadmill's speed and incline readouts show (L2-071 criteria 2 to 4).
import type { BikeState } from '@wattzup/api';
import { formatSpeed } from './metric-format';
import { formatPace } from './pace';

export interface SpeedView {
  valueText: string;
  paceText: string;
  statusText: string;
  /** `warning` while ramping, `success` at target; the text carries the state too. */
  statusTone: 'warning' | 'success' | null;
}

export interface InclineView {
  valueText: string;
  noteText: string | null;
}

/** Speeds within 0.05 km/h read as the same. */
const RAMP_TOLERANCE = 0.05;

export function speedView(state: BikeState | null): SpeedView {
  const speed = state?.speed_kmh ?? null;
  const target = state?.target_speed ?? null;
  const status = state?.workout?.status;
  const base = { valueText: formatSpeed(speed), paceText: `${formatPace(speed)} /km` };
  if (status === 'starting belt')
    return { ...base, statusText: 'Starting belt', statusTone: 'warning' };
  if (status === 'paused') return { ...base, statusText: 'Belt paused', statusTone: null };
  if (state?.belt === 'stopped') return { ...base, statusText: 'Belt stopped', statusTone: null };
  if (target !== null && (speed === null || Math.abs(speed - target) > RAMP_TOLERANCE + 1e-9)) {
    return { ...base, statusText: `Ramping to ${formatSpeed(target)}`, statusTone: 'warning' };
  }
  return { ...base, statusText: 'At target', statusTone: 'success' };
}

export function inclineView(state: BikeState | null): InclineView {
  const incline = state?.incline ?? null;
  const target = state?.target_incline ?? null;
  const w = state?.workout;
  const planned = w?.segments[w.segment]?.incline ?? null;
  return {
    valueText: incline === null ? '--' : String(incline),
    noteText:
      target !== null && target !== incline
        ? `Deck moving to ${target}%`
        : planned !== null
          ? `Plan ${planned}%`
          : null,
  };
}
