// The copy of the ride overlays (L2-058 AC3–AC6, L2-071 criteria 8 to 11).
import type { BikeState } from './api-types';
import { formatDuration } from './format-duration';
import type { RideOverlayKind } from './ride-view-state';

export interface RideOverlayText {
  kind: RideOverlayKind;
  role: 'status' | 'alert' | null;
  icon: 'bluetooth-off' | 'flag' | 'stop' | null;
  /** The belt countdown's 3, 2 or 1, shown large and hidden from assistive technology. */
  count: number | null;
  title: string;
  lines: string[];
  note: string | null;
}

const SAFETY_KEY =
  "Wattzup can't stop the belt while it's disconnected — use the treadmill's safety key or stop button.";

export function rideOverlayText(kind: RideOverlayKind, state: BikeState): RideOverlayText {
  return state.machine === 'treadmill'
    ? treadmillOverlayText(kind, state)
    : bikeOverlayText(kind, state);
}

function treadmillOverlayText(kind: RideOverlayKind, state: BikeState): RideOverlayText {
  const treadmill = state.device_label ?? 'Your treadmill';
  const elapsed = formatDuration(state.workout?.elapsed_seconds ?? 0);
  const base = { kind, count: null, note: null };
  switch (kind) {
    case 'belt-countdown':
      return {
        ...base,
        role: null,
        icon: null,
        count: state.belt_countdown,
        title: `Belt starting in ${state.belt_countdown}`,
        lines: ['Stand on the side rails. The belt starts when the count reaches zero.'],
      };
    case 'belt-starting':
      return { ...base, role: null, icon: null, title: 'Starting the belt…', lines: [] };
    case 'belt-stopped':
      return {
        ...base,
        role: 'alert',
        icon: 'stop',
        title: 'Belt stopped',
        lines: [
          `The treadmill's belt stopped, so Wattzup paused the ride at ${elapsed}. Press Resume to start the belt again after a 3-second countdown.`,
        ],
      };
    case 'scanning': {
      const lines = [
        'No Echelon treadmill found yet — switch it on. Wattzup scans again every 20 seconds.',
      ];
      if (state.workout?.status === 'waiting for bike') {
        lines.push(`Your ride starts as soon as the treadmill connects: ${state.workout.summary}.`);
      }
      return { ...base, role: 'status', icon: null, title: 'Looking for your treadmill', lines };
    }
    case 'bike-lost':
      return {
        ...base,
        role: 'alert',
        icon: 'bluetooth-off',
        title: 'Lost the treadmill',
        lines: [`${treadmill} stopped answering. ${SAFETY_KEY}`],
        note: 'The plan is paused. If the treadmill stays off for 90 seconds, Wattzup ends the ride.',
      };
    case 'bike-shut-off':
      return {
        ...base,
        role: 'status',
        icon: 'flag',
        title: 'Ride ended — the treadmill shut off',
        lines: [
          `${treadmill} was off for more than 90 seconds, so Wattzup ended the workout at ${elapsed}. Your numbers are kept below.`,
        ],
      };
    case 'adapter-off':
      return bikeOverlayText(kind, state);
  }
}

function bikeOverlayText(kind: RideOverlayKind, state: BikeState): RideOverlayText {
  const bike = state.device_label ?? 'Your bike';
  const elapsed = formatDuration(state.workout?.elapsed_seconds ?? 0);
  switch (kind) {
    case 'belt-countdown':
    case 'belt-starting':
    case 'belt-stopped':
    case 'scanning': {
      const lines = [
        'No Echelon bike found yet — pedal to wake it up. Wattzup scans again every 20 seconds.',
      ];
      if (state.workout?.status === 'waiting for bike') {
        lines.push(`Your ride starts as soon as the bike connects: ${state.workout.summary}.`);
      }
      return {
        kind,
        count: null,
        role: 'status',
        icon: null,
        title: 'Looking for your bike',
        lines,
        note: null,
      };
    }
    case 'adapter-off':
      return {
        kind,
        count: null,
        role: 'alert',
        icon: 'bluetooth-off',
        title: 'Bluetooth is off',
        lines: [
          "Wattzup can't reach this computer's Bluetooth adapter. Turn Bluetooth on — Wattzup retries every 3 seconds and connects on its own.",
        ],
        note: null,
      };
    case 'bike-lost':
      return {
        kind,
        count: null,
        role: 'alert',
        icon: 'bluetooth-off',
        title: 'Lost the bike',
        lines: [
          `${bike} stopped answering. Wake it with a pedal stroke, then reconnect — your ride is saved at ${elapsed}.`,
        ],
        note: 'The plan is paused. If the bike stays off for 90 seconds, Wattzup ends the ride.',
      };
    case 'bike-shut-off':
      return {
        kind,
        count: null,
        role: 'status',
        icon: 'flag',
        title: 'Ride ended — the bike shut off',
        lines: [
          `${bike} was off for more than 90 seconds, so Wattzup ended the workout at ${elapsed}. Your numbers are kept below.`,
        ],
        note: null,
      };
  }
}
