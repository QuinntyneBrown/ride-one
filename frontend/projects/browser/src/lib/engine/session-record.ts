// Mirrors Wattzup.Core/Sessions/SessionRecord.cs: a saved ride as L2-081 defines it, in the
// generated contract's shape, so both editions read and write the same history file (L2-094).
import type { SessionDetail, SessionSummary } from '@wattzup/api';

/** A session as stored: the detail the API answers, without what it adds on reading. */
export type SessionRecord = Omit<SessionDetail, 'previous' | 'bests'>;

export function toSummary(s: SessionRecord): SessionSummary {
  return {
    id: s.id,
    ended_at: s.ended_at,
    class_id: s.class_id,
    title: s.title,
    ridden_seconds: s.ridden_seconds,
    planned_seconds: s.planned_seconds,
    completed: s.completed,
    avg_power: s.avg_power,
    on_target_pct: s.on_target_pct,
    dip_count: s.dips.length,
  };
}
