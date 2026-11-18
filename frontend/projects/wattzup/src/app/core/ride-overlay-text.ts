// The copy of the ride overlays (L2-058 AC3–AC6, L2-071 criteria 14, 16 to 18).
import type { BikeState } from '@wattzup/api';
import { formatDuration } from './format-duration';
import type { RideOverlayKind } from './ride-view-state';

export interface RideOverlayText {
  kind: RideOverlayKind;
  role: 'status' | 'alert' | null;
  icon: 'bluetooth-off' | 'flag' | 'key' | null;
  /** The belt countdown's 3, 2 or 1, shown large and hidden from assistive technology. */
  count: number | null;
  title: string;
  lines: string[];
  note: string | null;
  /** The saved ride the overlay offers to open, on the bike (L2-084 AC2, AC3). */
  sessionId: string | null;
}

type OverlayCopy = Omit<RideOverlayText, 'sessionId'>;

export function rideOverlayText(kind: RideOverlayKind, state: BikeState): RideOverlayText {
  return state.machine === 'treadmill'
    ? { ...treadmillOverlayText(kind, state), sessionId: null }
    : { ...bikeOverlayText(kind, state), sessionId: state.workout?.session_id ?? null };
}

function treadmillOverlayText(kind: RideOverlayKind, state: BikeState): OverlayCopy {
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
        icon: 'key',
        title: 'Belt stopped',
        lines: [
          `The belt stopped, so Wattzup paused the run at ${elapsed}. If you pulled the safety key, clip it back in, then press Resume — the belt starts after a 3-second countdown.`,
        ],
      };
    case 'scanning': {
      const lines = [
        'No Echelon treadmill found yet — switch it on and clip in the safety key. Wattzup scans again every 20 seconds.',
      ];
      if (state.workout?.status === 'waiting for bike') {
        lines.push(`Your run starts as soon as the Stride connects: ${state.workout.summary}.`);
      }
      return { ...base, role: 'status', icon: null, title: 'Looking for your Stride', lines };
    }
    case 'bike-lost':
      return {
        ...base,
        role: 'alert',
        icon: 'bluetooth-off',
        title: 'Lost the Stride',
        // The belt claim rests on L2-043 criterion 5.
        lines: [
          `The Stride stopped answering and stopped its belt. Step onto the side rails, then reconnect — your run is saved at ${elapsed}.`,
        ],
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
    case 'ride-complete':
      return bikeOverlayText(kind, state);
  }
}

function bikeOverlayText(kind: RideOverlayKind, state: BikeState): OverlayCopy {
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
    case 'ride-complete':
      return {
        kind,
        count: null,
        role: 'status',
        icon: 'flag',
        title: 'Ride complete',
        lines: [
          `${state.workout?.summary ?? 'Your ride'} · ${formatDuration(state.workout?.total_seconds ?? 0)}. Your ride is saved.`,
        ],
        note: null,
      };
  }
}
