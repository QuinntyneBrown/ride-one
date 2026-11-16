// The copy of the ride overlays (L2-058 AC3–AC6).
import type { BikeState } from './api-types';
import { formatDuration } from './format-duration';
import type { RideOverlayKind } from './ride-view-state';

export interface RideOverlayText {
  kind: RideOverlayKind;
  role: 'status' | 'alert';
  icon: 'bluetooth-off' | 'flag' | null;
  title: string;
  lines: string[];
  note: string | null;
}

export function rideOverlayText(kind: RideOverlayKind, state: BikeState): RideOverlayText {
  const bike = state.device_label ?? 'Your bike';
  const elapsed = formatDuration(state.workout?.elapsed_seconds ?? 0);
  switch (kind) {
    case 'scanning': {
      const lines = [
        'No Echelon bike found yet — pedal to wake it up. Wattzup scans again every 20 seconds.',
      ];
      if (state.workout?.status === 'waiting for bike') {
        lines.push(`Your ride starts as soon as the bike connects: ${state.workout.summary}.`);
      }
      return {
        kind,
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
