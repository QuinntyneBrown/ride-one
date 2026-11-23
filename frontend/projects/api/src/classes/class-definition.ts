import type { Plan } from '../workout/plan';
import type { WorldId } from '../world/world';

/**
 * A class's video (ADR 0012): the YouTube video id and the sync offset, the second of the video at which the ride's
 * 0:00 falls.
 */
export interface ClassVideo {
  readonly videoId: string;
  readonly syncOffsetSeconds: number;
}

/**
 * The class as the app holds it (L2-080, ADR 0037): its words, its length, the plan the ride follows, its video and
 * the world it is ridden in. Telo Ride 1 has one, shipped with the app.
 */
export interface ClassDefinition {
  readonly id: string;
  readonly title: string;
  readonly channel: string;
  readonly focus: string;
  readonly lengthSeconds: number;
  readonly summary: string;
  readonly world: WorldId;
  readonly plan: Plan;
  readonly video: ClassVideo;
}
