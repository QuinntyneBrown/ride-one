import type { Plan } from '../workout/plan';

/**
 * A class as `GET /api/classes/{id}` serves it (L2-080, ADR 0014): what the class ride needs. The catalogue API
 * (slice 6.1) adds the channel, focus, shelf, summary and video.
 */
export interface ClassDto {
  readonly id: string;
  readonly title: string;
  readonly lengthSeconds: number;
  readonly plan: Plan;
}
