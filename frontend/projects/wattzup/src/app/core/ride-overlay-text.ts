// The copy of the ride overlays (L2-058 AC3–AC6, L2-084).
import type { BikeState, Edition } from '@wattzup/api';
import { formatDuration } from './format-duration';
import type { RideOverlayKind } from './ride-view-state';

export interface RideOverlayText {
  kind: RideOverlayKind;
  role: 'status' | 'alert' | 'region' | null;
  icon: 'bluetooth-off' | 'flag' | 'monitor-off' | 'lock' | null;
  title: string;
  lines: string[];
  note: string | null;
  /** The saved ride the overlay offers to open (L2-084 AC2, AC3). */
  sessionId: string | null;
  /** The address to copy, or to open over HTTPS (L2-089). */
  link: string | null;
  /** Bluetooth off in the browser edition: offer Check again (L2-089 AC2). */
  checkAgain: boolean;
}

export function rideOverlayText(
  kind: RideOverlayKind,
  state: BikeState,
  edition: Edition = 'backend',
  pageUrl = '',
): RideOverlayText {
  const base = { sessionId: state.workout?.session_id ?? null, link: null, checkAgain: false };
  const browser = browserCopy(kind, edition, pageUrl);
  return browser ? { ...base, ...browser } : { ...base, ...overlayCopy(kind, state) };
}

type Copy = Omit<RideOverlayText, 'sessionId' | 'link' | 'checkAgain'>;

/** The browser edition's overlays (L2-089): Web Bluetooth missing, not on HTTPS, or off. */
function browserCopy(
  kind: RideOverlayKind,
  edition: Edition,
  pageUrl: string,
): (Copy & Partial<Pick<RideOverlayText, 'link' | 'checkAgain'>>) | null {
  switch (kind) {
    case 'browser-unsupported':
      return {
        kind,
        role: 'alert',
        icon: 'monitor-off',
        title: 'Open Wattzup in Chrome or Edge',
        lines: [
          'Wattzup talks to your bike over Web Bluetooth, which Safari and Firefox don’t support. Your rides are saved per browser, so export them first if you have history here.',
        ],
        note: null,
        link: pageUrl,
      };
    case 'browser-insecure':
      return {
        kind,
        role: 'alert',
        icon: 'lock',
        title: 'Open the secure version of this page',
        lines: [`Browsers only allow Bluetooth on pages served over HTTPS. You’re on ${pageUrl}.`],
        note: null,
        link: pageUrl.replace(/^http:/, 'https:'),
      };
    case 'adapter-off':
      return edition === 'browser'
        ? {
            kind,
            role: 'alert',
            icon: 'bluetooth-off',
            title: 'Turn on Bluetooth',
            lines: [
              'Your browser can’t see a Bluetooth radio. Switch it on in your computer’s settings — or, if this machine has none, plug in a USB Bluetooth adapter.',
            ],
            note: null,
            checkAgain: true,
          }
        : null;
    default:
      return null;
  }
}

function overlayCopy(kind: RideOverlayKind, state: BikeState): Copy {
  const bike = state.device_label ?? 'Your bike';
  const elapsed = formatDuration(state.workout?.elapsed_seconds ?? 0);
  switch (kind) {
    // The browser-only kinds are worded by browserCopy and never reach here.
    case 'browser-unsupported':
    case 'browser-insecure':
    case 'connect-bike':
      return {
        kind,
        role: 'region',
        icon: null,
        title: 'Connect your bike',
        lines: [
          'Wake the bike with a few pedal strokes, then pick it from the list your browser shows. Wattzup remembers it next time.',
        ],
        note: 'Not in the list? Close the Echelon app on your phone — the bike talks to one device at a time.',
      };
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
    case 'ride-complete':
      return {
        kind,
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
