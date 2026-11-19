// The checks an imported session must pass to be kept (L2-094 AC6): every field of the L2-081
// record with its type and range, and a plan the workout validation of L2-010 accepts. Only the
// record's own fields are kept, so a file's extra fields never reach the store.
import type { Dip, RideVideo, Segment, SegmentKind } from '@wattzup/api';
import type { SessionRecord } from '../engine/session-record';
import { validatePlan } from '../engine/workout-plan-validator';

type Json = Record<string, unknown>;
const KINDS: readonly SegmentKind[] = ['warmup', 'work', 'rest', 'cooldown', 'steady'];
const ID = /^[a-f0-9]{12}$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const MAX_TEXT = 200;

const isObject = (v: unknown): v is Json =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const isIntOrNull = (v: unknown, min = 0, max?: number) => v === null || isInt(v, min, max);
const isText = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= MAX_TEXT;
const isKind = (v: unknown): v is SegmentKind => KINDS.includes(v as SegmentKind);
const isIntArray = (v: unknown): v is number[] => Array.isArray(v) && v.every((x) => isInt(x, 0));

function segment(v: unknown): Segment | null {
  if (!isObject(v)) return null;
  const { kind, start, duration, level, cadence, round } = v;
  if (!isKind(kind) || !isInt(start) || !isInt(duration, 1) || !isInt(level, 1, 32)) return null;
  if (!isIntOrNull(cadence) || !isIntOrNull(round, 1)) return null;
  return { kind, start, duration, level, cadence, round } as Segment;
}

function dip(v: unknown): Dip | null {
  if (!isObject(v)) return null;
  const { start, duration, target, low, kind, round } = v;
  if (!isInt(start) || !isInt(duration, 1) || !isInt(target) || !isInt(low) || !isKind(kind))
    return null;
  if (!isIntOrNull(round, 1)) return null;
  return { start, duration, target, low, kind, round } as Dip;
}

function video(v: unknown): RideVideo | null | undefined {
  if (v === null || v === undefined) return null;
  if (!isObject(v) || typeof v['video_id'] !== 'string' || !VIDEO_ID.test(v['video_id']))
    return undefined;
  const start = v['start_seconds'];
  if (typeof start !== 'number' || start < 0 || start > 43200) return undefined;
  return { video_id: v['video_id'], start_seconds: start };
}

function list<T>(v: unknown, item: (x: unknown) => T | null): T[] | null {
  if (!Array.isArray(v)) return null;
  const out = v.map(item);
  return out.every((x) => x !== null) ? (out as T[]) : null;
}

/** The session, or null when L2-081 rejects it. */
export function validSession(v: unknown): SessionRecord | null {
  if (!isObject(v)) return null;
  const s = v;
  if (typeof s['id'] !== 'string' || !ID.test(s['id'])) return null;
  if (typeof s['ended_at'] !== 'string' || Number.isNaN(Date.parse(s['ended_at']))) return null;
  if (s['class_id'] !== null && !isText(s['class_id'])) return null;
  if (!isText(s['title'])) return null;
  if (!isObject(s['plan'])) return null;
  const rideVideo = video(s['plan']['video']);
  const plan = validatePlan({ ...s['plan'], video: null }).plan;
  if (!plan || rideVideo === undefined) return null;
  const segments = list(s['segments'], segment);
  const dips = list(s['dips'], dip);
  if (!segments || segments.length === 0 || !dips) return null;
  const ints = [
    'planned_seconds',
    'ridden_seconds',
    'avg_power',
    'max_power',
    'best_minute_power',
    'avg_cadence',
    'kcal',
  ];
  if (!ints.every((k) => isInt(s[k])) || !isInt(s['on_target_pct'], 0, 100)) return null;
  if (typeof s['distance_km'] !== 'number' || !(s['distance_km'] >= 0)) return null;
  if (typeof s['completed'] !== 'boolean') return null;
  if (!isIntArray(s['power_trace']) || !isIntArray(s['cadence_trace'])) return null;
  return {
    id: s['id'],
    ended_at: s['ended_at'],
    class_id: s['class_id'] as string | null,
    title: s['title'],
    plan: { ...plan, video: rideVideo },
    segments,
    planned_seconds: s['planned_seconds'] as number,
    ridden_seconds: s['ridden_seconds'] as number,
    completed: s['completed'],
    avg_power: s['avg_power'] as number,
    max_power: s['max_power'] as number,
    best_minute_power: s['best_minute_power'] as number,
    avg_cadence: s['avg_cadence'] as number,
    distance_km: s['distance_km'],
    kcal: s['kcal'] as number,
    on_target_pct: s['on_target_pct'],
    dips,
    power_trace: s['power_trace'],
    cadence_trace: s['cadence_trace'],
  };
}
