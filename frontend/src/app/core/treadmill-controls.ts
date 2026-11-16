// The treadmill side panel's rules (L2-071 criteria 5 and 6, L2-068).
import type { BikeState } from './api-types';
import type { PlanNote } from './resistance-controls';
import {
  INCLINE_STEP,
  MAX_INCLINE,
  MAX_SPEED,
  MIN_INCLINE,
  MIN_SPEED,
  SPEED_STEP,
} from './treadmill-plan-form';

export { INCLINE_STEP, MAX_INCLINE, MAX_SPEED, MIN_INCLINE, MIN_SPEED, SPEED_STEP };

const DEFAULT_SPEED = 7.0;
const DEFAULT_INCLINE = 0;

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/** The reported speed when above 0, else the target, else 7.0 km/h. */
export function baseSpeed(state: BikeState | null): number {
  const speed = state?.speed_kmh ?? null;
  if (speed !== null && speed > 0) return speed;
  return state?.target_speed ?? DEFAULT_SPEED;
}

export function stepSpeed(state: BikeState | null, dir: 1 | -1): number {
  return clamp(Math.round((baseSpeed(state) + dir * SPEED_STEP) * 10) / 10, MIN_SPEED, MAX_SPEED);
}

/** The reported incline, else the target, else 0. */
export function baseIncline(state: BikeState | null): number {
  return state?.incline ?? state?.target_incline ?? DEFAULT_INCLINE;
}

export function stepIncline(state: BikeState | null, dir: 1 | -1): number {
  return clamp(baseIncline(state) + dir * INCLINE_STEP, MIN_INCLINE, MAX_INCLINE);
}

export interface TreadmillControlsState {
  lowerSpeedDisabled: boolean;
  raiseSpeedDisabled: boolean;
  lowerInclineDisabled: boolean;
  raiseInclineDisabled: boolean;
}

export function treadmillControlsState(
  state: BikeState | null,
  commandsEnabled: boolean,
): TreadmillControlsState {
  if (!commandsEnabled) {
    return {
      lowerSpeedDisabled: true,
      raiseSpeedDisabled: true,
      lowerInclineDisabled: true,
      raiseInclineDisabled: true,
    };
  }
  const speed = baseSpeed(state);
  const incline = baseIncline(state);
  return {
    lowerSpeedDisabled: speed <= MIN_SPEED,
    raiseSpeedDisabled: speed >= MAX_SPEED,
    lowerInclineDisabled: incline <= MIN_INCLINE,
    raiseInclineDisabled: incline >= MAX_INCLINE,
  };
}

/** Whether the plan or the rider sets the speed and incline, and Back to plan. */
export function treadmillPlanNote(state: BikeState | null): PlanNote {
  const w = state?.workout;
  if (!w) return { text: 'Manual control — no plan is running.', backToPlan: false };
  const flat = w.plan.kind === 'flat';
  if (w.mode === 'manual') {
    const planSpeed = w.segments[w.segment]?.speed ?? null;
    return {
      text:
        flat && planSpeed !== null
          ? `Manual speed and incline. Plan was ${planSpeed.toFixed(1)} km/h.`
          : 'Manual speed and incline. Plan takes over next interval.',
      backToPlan: true,
    };
  }
  return {
    text: flat
      ? 'Holding a flat speed and incline for the whole ride.'
      : 'Following the plan — speed and incline change with each interval.',
    backToPlan: false,
  };
}
