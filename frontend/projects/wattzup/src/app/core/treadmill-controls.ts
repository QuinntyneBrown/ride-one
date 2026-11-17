// The treadmill side panel's rules (L2-071 criteria 8 to 11, L2-068).
import type { BikeState } from '@wattzup/api';
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

/** The quick speeds, in km/h (L2-071 criterion 8). */
export const QUICK_SPEEDS = [5, 8, 10, 12, 14, 16] as const;
export const BELT_NOTE = 'Speed and incline controls wake up once the belt is running.';

const DEFAULT_SPEED = 7.0;
const DEFAULT_INCLINE = 0;

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));
const segmentOf = (state: BikeState | null) => {
  const w = state?.workout;
  return w ? (w.segments[w.segment] ?? null) : null;
};

/** `target_speed`, else the current segment's speed, else 7.0 km/h. */
export function baseSpeed(state: BikeState | null): number {
  return state?.target_speed ?? segmentOf(state)?.speed ?? DEFAULT_SPEED;
}

export function stepSpeed(state: BikeState | null, dir: 1 | -1): number {
  return clamp(Math.round((baseSpeed(state) + dir * SPEED_STEP) * 10) / 10, MIN_SPEED, MAX_SPEED);
}

/** `target_incline`, else `incline`, else 0. */
export function baseIncline(state: BikeState | null): number {
  return state?.target_incline ?? state?.incline ?? DEFAULT_INCLINE;
}

export function stepIncline(state: BikeState | null, dir: 1 | -1): number {
  return clamp(baseIncline(state) + dir * INCLINE_STEP, MIN_INCLINE, MAX_INCLINE);
}

export interface TreadmillControlsState {
  lowerSpeedDisabled: boolean;
  raiseSpeedDisabled: boolean;
  lowerInclineDisabled: boolean;
  raiseInclineDisabled: boolean;
  quickDisabled: boolean;
  pickerDisabled: boolean;
  /** The quick speed equal to `target_speed`, or null. */
  pressedQuick: number | null;
  /** `Speed and incline controls wake up once the belt is running.`, or null. */
  note: string | null;
}

export function treadmillControlsState(
  state: BikeState | null,
  commandsEnabled: boolean,
): TreadmillControlsState {
  const target = state?.target_speed ?? null;
  const pressedQuick = QUICK_SPEEDS.find((q) => target !== null && Math.abs(q - target) < 0.05);
  const belt = state?.belt === 'running';
  const paused = state?.workout?.status.startsWith('paused') ?? false;
  const note = commandsEnabled && !belt && !paused ? BELT_NOTE : null;
  if (!commandsEnabled || !belt) {
    return {
      lowerSpeedDisabled: true,
      raiseSpeedDisabled: true,
      lowerInclineDisabled: true,
      raiseInclineDisabled: true,
      quickDisabled: true,
      pickerDisabled: true,
      pressedQuick: pressedQuick ?? null,
      note,
    };
  }
  const speed = baseSpeed(state);
  const incline = baseIncline(state);
  return {
    lowerSpeedDisabled: speed <= MIN_SPEED,
    raiseSpeedDisabled: speed >= MAX_SPEED,
    lowerInclineDisabled: incline <= MIN_INCLINE,
    raiseInclineDisabled: incline >= MAX_INCLINE,
    quickDisabled: false,
    pickerDisabled: false,
    pressedQuick: pressedQuick ?? null,
    note: null,
  };
}

/** Whether the plan or the rider sets the speed and incline, and Back to plan (L2-071 AC11). */
export function treadmillPlanNote(state: BikeState | null): PlanNote {
  const w = state?.workout;
  if (!w) return { text: 'Manual control — no plan is running.', backToPlan: false };
  const flat = w.plan.kind === 'flat';
  if (w.mode === 'manual') {
    const segment = w.segments[w.segment];
    const speedOff =
      state?.target_speed != null &&
      segment?.speed != null &&
      Math.abs(state.target_speed - segment.speed) >= 0.05;
    const inclineOff =
      state?.target_incline != null &&
      segment?.incline != null &&
      state.target_incline !== segment.incline;
    const what =
      speedOff && !inclineOff
        ? 'Manual speed.'
        : inclineOff && !speedOff
          ? 'Manual incline.'
          : 'Manual speed and incline.';
    return {
      text: w.plan.kind === 'hiit' ? `${what} Plan takes over next interval.` : what,
      backToPlan: true,
    };
  }
  return {
    text: flat
      ? 'Holding one speed and incline for the whole run.'
      : 'Following the plan — speed and incline change with each interval.',
    backToPlan: false,
  };
}
