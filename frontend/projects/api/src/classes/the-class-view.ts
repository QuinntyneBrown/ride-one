import type { RideWith } from './how-to-ride';

/** The start button of The Class: its words, the line under it, and the screen it opens (L2-084 AC4, AC6, AC7). */
export interface StartAction {
  readonly label: string;
  readonly hint: string | null;
  readonly opens: 'ride' | 'connect';
}

/** One option of "Ride with" (L2-173): its name, the line under it, and whether it can be chosen. */
export interface RideWithOption {
  readonly way: RideWith;
  readonly name: string;
  readonly detail: string | null;
  readonly disabled: boolean;
}

/** A picture with its text alternative. */
export interface Picture {
  readonly url: string;
  readonly alt: string;
}

/** The Class as it is drawn (L2-084, L2-173): what the page hands the `the-class` block. */
export interface TheClassView {
  /** "GCN Training · Intervals". */
  readonly meta: string;
  readonly title: string;
  readonly summary: string;
  /** "20:00", with "start to finish" beside it. */
  readonly length: string;
  readonly lengthLabel: string;
  /** The class cover, under the video player. */
  readonly cover: Picture;
  /** The course's still, in the video's box when the rider has chosen Ibiza; `null` with the class video. */
  readonly still: Picture | null;
  /** The video cannot load: the cover stands alone, with no player over it (L2-084 AC9). */
  readonly videoUnavailable: boolean;
  readonly rideWith: RideWith;
  readonly options: readonly RideWithOption[];
  readonly start: StartAction;
}
