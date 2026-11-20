// The one module that names the contract's types (contract/schema.d.ts). If a schema name
// changes, only these aliases change.
import type { components } from '../contract/schema';

type Schemas = components['schemas'];

export type BikeState = Schemas['BikeState'];
export type WorkoutSnapshot = Schemas['WorkoutSnapshot'];
export type Segment = Schemas['Segment'];
export type SegmentKind = Segment['kind'];
export type WorkoutStatus = WorkoutSnapshot['status'];
export type CommandEntry = Schemas['CommandEntry'];
export type HiitPlan = Schemas['WorkoutPlanHiitPlan'];
export type FlatPlan = Schemas['WorkoutPlanFlatPlan'];
export type IntervalsPlan = Schemas['WorkoutPlanIntervalsPlan'];
export type IntervalSet = Schemas['IntervalSet'];
export type Stretch = Schemas['Stretch'];
export type WorkoutPlan = Schemas['WorkoutPlan'];
export type RideVideo = Schemas['RideVideo'];
export type RideVideoLink = Schemas['RideVideoLink'];
/**
 * A plan as WORKOUT_API's start takes it: its `video` is a link and a start point (L2-010 AC14),
 * and `class_id` names the class it was started from, for the session (L2-081 AC7).
 */
export type StartPlan = WorkoutPlan extends infer P
  ? P extends WorkoutPlan
    ? Omit<P, 'video'> & { video: RideVideoLink | null; class_id?: string }
    : never
  : never;
export type PowerTrace = Schemas['PowerTrace'];
export type ClassCatalogue = Schemas['ClassCatalogueResponse'];
export type ClassShelf = Schemas['ClassShelfResponse'];
export type ClassEntry = Schemas['ClassResponse'];
/** The id of one of the six World Ride scenes a class may name (L2-100). */
export type WorldId = NonNullable<ClassEntry['world']>;
export type SessionSummary = Schemas['SessionSummary'];
export type SessionDetail = Schemas['SessionDetail'];
export type SessionList = Schemas['SessionList'];
export type Dip = Schemas['Dip'];
export type ProgressReport = Schemas['ProgressReport'];
export type StreakFigures = Schemas['StreakFigures'];
export type ClassAttempts = Schemas['ClassAttempts'];
export type AchievementFigures = Schemas['AchievementFigures'];
