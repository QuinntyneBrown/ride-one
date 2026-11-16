// The one module that names the generated OpenAPI types (src/app/api/schema.d.ts).
// If the generated schema names differ, only these aliases change.
import type { components } from '../api/schema';

type Schemas = components['schemas'];

export type BikeState = Schemas['BikeState'];
export type WorkoutSnapshot = Schemas['WorkoutSnapshot'];
export type Segment = Schemas['Segment'];
export type SegmentKind = Segment['kind'];
export type WorkoutStatus = WorkoutSnapshot['status'];
export type CommandEntry = Schemas['CommandEntry'];
export type HiitPlan = Schemas['HiitPlan'];
export type FlatPlan = Schemas['FlatPlan'];
export type WorkoutPlan = HiitPlan | FlatPlan;
export type PowerTrace = Schemas['PowerTrace'];
export type PacketLines = Schemas['PacketLines'];
export type EventToken = Schemas['EventToken'];
export type ProblemDetails = Schemas['ProblemDetails'];
export type StartWorkoutResponse = Schemas['StartWorkoutResponse'];
