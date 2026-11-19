// The ride in progress, kept so a page closed or reloaded mid-ride loses at most 10 s of it
// (L2-092 AC5). The engine writes it every 10 running seconds and on pagehide and clears it when
// the ride ends; on the next load SessionStore saves it as an ended session when L2-081 would
// (at least 60 running seconds), and never resumes it.
import type { Segment, WorkoutPlan } from '@wattzup/api';
import type { RideSample } from '../engine/workout-engine';

export interface RideJournalEntry {
  classId: string | null;
  title: string;
  plan: WorkoutPlan;
  segments: Segment[];
  samples: RideSample[];
  totals: { runningSeconds: number; powerSum: number; distanceKm: number };
  /** When it was written, in Unix ms: the saved session's end. */
  savedAt: number;
}
