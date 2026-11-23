import type {
  ClassDefinition,
  RideWith,
  RideWithOption,
  Segment,
  StartAction,
  TheClassView,
  WhatTheBikeWillDo,
} from '@telo/api';
import { formatClock } from '@telo/components';
import { PlanSummary } from '@telo/domain';

/** Ibiza Sunset Strip as The Class names it (L2-173 AC3, AC6): the only course. Its still ships with the app. */
const IBIZA = {
  name: 'Ibiza Sunset Strip',
  facts: '8.4 km · 159 m of climbing',
  cannotDraw: 'This browser can’t draw Ibiza.',
  still: {
    url: 'maps/ibiza-sunset-strip-photo.jpg',
    alt: 'Ibiza Sunset Strip: a seafront road at sunset',
  },
} as const;

/** What The Class is drawn from. */
export interface TheClassState {
  readonly definition: ClassDefinition;
  /** The bike is connected (`ble` is `connected`). */
  readonly connected: boolean;
  /** How the class will be ridden (`rideWith`). */
  readonly rideWith: RideWith;
  /** The browser can draw the course. */
  readonly drawable: boolean;
  readonly videoUnavailable: boolean;
}

/**
 * The start button (L2-084 AC4, AC6, AC7): "Start class" opens the ride with a connected bike; without one it reads
 * "Connect your bike", says why, and opens Connect Bike. Its words never follow the choice of how to ride (L2-173 AC5).
 * "Ride it again" joins with the record (slice 32.6), the blocked browser's disabled button with slice 30.6.
 */
export function startAction(connected: boolean): StartAction {
  return connected
    ? { label: 'Start class', hint: null, opens: 'ride' }
    : {
        label: 'Connect your bike',
        hint: 'The class needs the bike to set resistance.',
        opens: 'connect',
      };
}

/** The two options of "Ride with" (L2-173 AC1, AC3, AC6): Ibiza says how far and how high, or why it cannot be chosen. */
export function rideWithOptions(drawable: boolean): readonly RideWithOption[] {
  return [
    { way: 'video', name: 'Class video', detail: null, disabled: false },
    {
      way: 'ibiza',
      name: IBIZA.name,
      detail: drawable ? IBIZA.facts : IBIZA.cannotDraw,
      disabled: !drawable,
    },
  ];
}

/** The line under the resistance profile, whatever the plan (L2-084 AC2). */
const JUST_PEDAL = 'Resistance changes on its own; you just pedal.';

/**
 * "What the bike will do" (L2-084 AC2, AC3): "~254 W average", the plan's time-weighted target power, rounded; the
 * segments the resistance profile is drawn from; and "17 efforts · 0:15 to 1:15. Resistance changes on its own; you
 * just pedal.", the efforts counted and their shortest and longest lengths read from the plan. Efforts of one length
 * read that length once, and a plan with no effort only the sentence.
 */
export function whatTheBikeWillDo(segments: readonly Segment[]): WhatTheBikeWillDo {
  const { count, shortest, longest } = PlanSummary.efforts(segments);
  const lengths =
    shortest === longest
      ? formatClock(shortest)
      : `${formatClock(shortest)} to ${formatClock(longest)}`;
  return {
    average: `~${PlanSummary.averagePower(segments)} W average`,
    segments,
    note:
      count === 0
        ? JUST_PEDAL
        : `${count} ${count === 1 ? 'effort' : 'efforts'} · ${lengths}. ${JUST_PEDAL}`,
  };
}

/** The Class as it is drawn (L2-084 AC1 to AC3, L2-173). */
export function theClassView(state: TheClassState): TheClassView {
  const { definition } = state;
  return {
    meta: `${definition.channel} · ${definition.focus}`,
    title: definition.title,
    summary: definition.summary,
    length: formatClock(definition.lengthSeconds),
    lengthLabel: 'start to finish',
    // YouTube's 4:3 cover, cropped to its 16:9 picture (ADR 0014).
    cover: {
      url: `https://i.ytimg.com/vi/${encodeURIComponent(definition.video.videoId)}/hqdefault.jpg`,
      alt: `Video: ${definition.title}, ${definition.channel}`,
    },
    still: state.rideWith === 'ibiza' ? IBIZA.still : null,
    videoUnavailable: state.videoUnavailable,
    rideWith: state.rideWith,
    options: rideWithOptions(state.drawable),
    start: startAction(state.connected),
    plan: whatTheBikeWillDo(definition.plan.segments),
  };
}
