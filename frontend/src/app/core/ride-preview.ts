// The "Your ride" panel values, from the same plan expansion as the backend (L2-059).
import type { SegmentKind, WorkoutPlan } from './api-types';
import { formatDuration } from './format-duration';
import { averageTargetPower, energyKcal, expandPlan, totalSeconds } from './plan-expansion';

export type ProfileTone = 'is-work' | 'is-rest' | 'is-easy';

export interface ProfileBar {
  x: number;
  width: number;
  y: number;
  height: number;
  tone: ProfileTone;
}

export interface RidePreview {
  totalSeconds: number;
  total: string;
  structure: string;
  timeUnderLoad: string | null;
  peakLevel: number;
  avgPower: number;
  kcal: number;
  profile: ProfileBar[];
  legend: ('work' | 'rest' | 'steady')[];
}

const round2 = (v: number): number => Math.round(v * 100) / 100;

export function profileTone(kind: SegmentKind): ProfileTone {
  if (kind === 'work' || kind === 'steady') return 'is-work';
  if (kind === 'rest') return 'is-rest';
  return 'is-easy';
}

export function previewOf(plan: WorkoutPlan): RidePreview {
  const segments = expandPlan(plan);
  const total = totalSeconds(segments);
  const avgPower = averageTargetPower(segments);
  const inset = 0.002 * total;
  return {
    totalSeconds: total,
    total: formatDuration(total),
    structure:
      plan.kind === 'hiit'
        ? `${plan.rounds} × ${formatDuration(plan.work_seconds)} / ${formatDuration(plan.rest_seconds)}`
        : `Level ${plan.level} throughout`,
    timeUnderLoad: plan.kind === 'hiit' ? formatDuration(plan.rounds * plan.work_seconds) : null,
    peakLevel: Math.max(...segments.map((s) => s.level ?? 0)),
    avgPower,
    kcal: energyKcal(avgPower, total),
    profile: segments.map((s) => ({
      x: round2(s.start + inset),
      width: round2(s.duration - 2 * inset),
      y: 32 - (s.level ?? 0),
      height: s.level ?? 0,
      tone: profileTone(s.kind),
    })),
    legend: plan.kind === 'hiit' ? ['work', 'rest'] : ['steady'],
  };
}
