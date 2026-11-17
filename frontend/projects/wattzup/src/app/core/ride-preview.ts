// The "Your ride" panel values, from the same plan expansion as the backend (L2-059, L2-072).
import type { HiitPlan, IntervalsPlan, Segment, SegmentKind, WorkoutPlan } from '@wattzup/api';
import {
  type InclineProfile,
  type ProfileBar,
  type ProfileTone,
  type RidePreview,
  type SummaryRow,
  formatDuration,
  formatPace,
} from '@wattzup/components';
import { formatStart } from './video-link';
import { kcalPerSecond } from './treadmill-energy';
import { MAX_SPEED } from './treadmill-plan-form';
import {
  averageTargetPower,
  energyKcal,
  expandPlan,
  effortCount,
  totalSeconds,
} from './plan-expansion';

export type { InclineProfile, ProfileBar, ProfileTone, RidePreview, SummaryRow };

export interface BikeRidePreview extends RidePreview {
  peakLevel: number;
  avgPower: number;
  kcal: number;
}

export interface TreadmillRidePreview extends RidePreview {
  topSpeed: number;
  distanceKm: number;
}

/** The profile view box is 32 units high: a level is one unit, a km/h two (16 km/h fills it). */
const PROFILE_HEIGHT = 32;
const round2 = (v: number): number => Math.round(v * 100) / 100;

export function profileTone(kind: SegmentKind): ProfileTone {
  if (kind === 'work' || kind === 'steady') return 'is-work';
  if (kind === 'rest') return 'is-rest';
  return 'is-easy';
}

function profileOf(segments: readonly Segment[], height: (s: Segment) => number): ProfileBar[] {
  const inset = 0.002 * totalSeconds(segments);
  return segments.map((s) => ({
    x: round2(s.start + inset),
    width: round2(s.duration - 2 * inset),
    y: PROFILE_HEIGHT - height(s),
    height: height(s),
    tone: profileTone(s.kind),
  }));
}

function common(plan: WorkoutPlan, segments: readonly Segment[], structure: string) {
  const total = totalSeconds(segments);
  return {
    totalSeconds: total,
    total: formatDuration(total),
    structure,
    timeUnderLoad: plan.kind === 'flat' ? null : formatDuration(timeUnderLoad(segments)),
    legend: (plan.kind === 'flat' ? ['steady'] : ['work', 'rest']) as RidePreview['legend'],
  };
}

/** The sum of every effort's work time. */
function timeUnderLoad(segments: readonly Segment[]): number {
  return segments.filter((s) => s.kind === 'work').reduce((sum, s) => sum + s.duration, 0);
}

const plural = (n: number, one: string): string => `${n} ${one}${n === 1 ? '' : 's'}`;

/** `<sets> sets · <efforts> efforts` (L2-059 criterion 5). */
function intervalsStructure(plan: IntervalsPlan): string {
  return `${plural(plan.sets.length, 'set')} · ${plural(effortCount(plan), 'effort')}`;
}

function hiitStructure(plan: HiitPlan): string {
  return `${plan.rounds} × ${formatDuration(plan.work_seconds)} / ${formatDuration(plan.rest_seconds)}`;
}

function rowsOf(base: { structure: string; timeUnderLoad: string | null }): SummaryRow[] {
  const rows = [{ term: 'Structure', value: base.structure }];
  if (base.timeUnderLoad) rows.push({ term: 'Time under load', value: base.timeUnderLoad });
  return rows;
}

export function previewOf(plan: WorkoutPlan): BikeRidePreview {
  const segments = expandPlan(plan);
  const structure =
    plan.kind === 'hiit'
      ? hiitStructure(plan)
      : plan.kind === 'intervals'
        ? intervalsStructure(plan)
        : `Level ${plan.level} throughout`;
  const base = common(plan, segments, structure);
  const avgPower = averageTargetPower(segments);
  const peakLevel = Math.max(...segments.map((s) => s.level ?? 0));
  const kcal = energyKcal(avgPower, base.totalSeconds);
  return {
    ...base,
    peakLevel,
    avgPower,
    kcal,
    profileLabel: `Resistance profile: ${base.structure}`,
    profile: profileOf(segments, (s) => s.level ?? 0),
    profileHeight: PROFILE_HEIGHT,
    incline: null,
    noun: 'ride',
    rows: [
      ...rowsOf(base),
      { term: 'Peak resistance', value: `Level ${peakLevel}` },
      { term: 'Expected avg power', value: `~${avgPower} W` },
      { term: 'Expected energy', value: `~${kcal} kcal` },
    ],
  };
}

const round1 = (v: number): number => Math.round(v * 10) / 10;
/** The run's speed profile is 10 units per km/h, so 19.3 km/h fills it (L2-072 AC8). */
const RUN_PROFILE_HEIGHT = Math.round(MAX_SPEED * 10);

/** Distance, climb and energy summed one second at a time, as the engine sums ticks (L2-064). */
function runTotals(segments: readonly Segment[]) {
  let km = 0;
  let climbM = 0;
  let kcal = 0;
  for (const s of segments) {
    const speed = s.speed ?? 0;
    const incline = s.incline ?? 0;
    for (let t = 0; t < s.duration; t++) {
      km += speed / 3600;
      climbM += ((speed / 3600) * 1000 * incline) / 100;
      kcal += kcalPerSecond(speed, incline);
    }
  }
  return { km, climbM, kcal };
}

function inclineProfile(segments: readonly Segment[], steepest: number): InclineProfile {
  const points: string[] = [];
  for (const s of segments) {
    const y = 10 - (s.incline ?? 0);
    points.push(`${s.start},${y}`, `${s.start + s.duration},${y}`);
  }
  const line = points.filter((p, i) => p !== points[i - 1]).join(' ');
  const end = segments.length ? segments.at(-1)!.start + segments.at(-1)!.duration : 0;
  return { label: `Incline profile, steepest ${steepest}%`, line, area: `0,10 ${line} ${end},10` };
}

/** A treadmill plan's panel, `Your run` (L2-072 AC8). */
export function treadmillPreviewOf(plan: WorkoutPlan): TreadmillRidePreview {
  const segments = expandPlan(plan);
  const structure =
    plan.kind === 'flat'
      ? `${(plan.speed ?? 0).toFixed(1)} km/h at ${plan.incline ?? 0}%`
      : plan.kind === 'hiit'
        ? hiitStructure(plan)
        : intervalsStructure(plan);
  const base = common(plan, segments, structure);
  const topSpeed = Math.max(...segments.map((s) => s.speed ?? 0));
  const steepest = Math.max(...segments.map((s) => s.incline ?? 0));
  const totals = runTotals(segments);
  const inset = 0.002 * base.totalSeconds;
  return {
    ...base,
    topSpeed,
    distanceKm: totals.km,
    profileLabel: `Speed profile: ${base.structure}, top speed ${topSpeed.toFixed(1)} km/h`,
    profile: segments.map((s) => {
      const height = round1((s.speed ?? 0) * 10);
      return {
        x: round1(s.start + inset),
        width: round1(s.duration - 2 * inset),
        y: round1(RUN_PROFILE_HEIGHT - height),
        height,
        tone: profileTone(s.kind),
      };
    }),
    profileHeight: RUN_PROFILE_HEIGHT,
    incline: inclineProfile(segments, steepest),
    noun: 'run',
    rows: [
      { term: 'Structure', value: base.structure },
      { term: 'Top speed', value: `${topSpeed.toFixed(1)} km/h · ${formatPace(topSpeed)} /km` },
      { term: 'Steepest', value: `${steepest}%` },
      { term: 'Expected distance', value: `~${totals.km.toFixed(2)} km` },
      { term: 'Expected climb', value: `~${Math.round(totals.climbM)} m` },
      { term: 'Expected energy', value: `~${Math.round(totals.kcal)} kcal` },
    ],
  };
}

/**
 * The preview with `Video` `Synced from <m:ss.s>` after Time under load (after Structure when
 * there is none), while the plan carries a video; otherwise the preview unchanged (L2-059 AC6).
 */
export function withVideoRow<P extends RidePreview>(
  preview: P | null,
  start: number | null,
): P | null {
  if (!preview || start === null) return preview;
  const rows = [...preview.rows];
  const after = rows.findIndex((r) => r.term === 'Time under load');
  rows.splice((after < 0 ? 0 : after) + 1, 0, {
    term: 'Video',
    value: `Synced from ${formatStart(start)}`,
  });
  return { ...preview, rows };
}
