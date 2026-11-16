// What the treadmill's speed and incline readouts show (L2-071 criteria 1 and 2).
import type { BikeState } from './api-types';
import { formatSpeed } from './metric-format';

export interface SpeedView {
  valueText: string;
  mphText: string;
  targetText: string | null;
  settingText: string | null;
}

export interface InclineView {
  valueText: string;
  targetText: string | null;
  settingText: string | null;
}

/** Speeds within 0.05 km/h read as the same. */
const sameSpeed = (a: number | null, b: number | null): boolean =>
  a !== null && b !== null && Math.abs(a - b) < 0.05;

export function speedView(state: BikeState | null): SpeedView {
  const speed = state?.speed_kmh ?? null;
  const target = state?.target_speed ?? null;
  const setting = target !== null && !sameSpeed(target, speed);
  return {
    valueText: formatSpeed(speed),
    mphText: `${formatSpeed(state?.speed_mph ?? null)} mph`,
    targetText: target !== null && !setting ? `Target ${formatSpeed(target)} km/h` : null,
    settingText: setting ? `Setting ${formatSpeed(target)}…` : null,
  };
}

export function inclineView(state: BikeState | null): InclineView {
  const incline = state?.incline ?? null;
  const target = state?.target_incline ?? null;
  const setting = target !== null && target !== incline;
  return {
    valueText: incline === null ? '--' : String(incline),
    targetText: target !== null && !setting ? `Target ${target} %` : null,
    settingText: setting ? `Setting ${target}…` : null,
  };
}
