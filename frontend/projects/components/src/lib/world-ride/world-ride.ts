import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/** What the World Ride HUD shows, computed by the page from the live state, the class and its world. */
export interface WorldRideView {
  /** The world's name, e.g. `Old Town Criterium`: the heading and the screen's accessible name. */
  readonly title: string;
  /** `<route> · <class title>`. */
  readonly classLine: string;
  /** The bike's name from the live state, rendered as text. */
  readonly bike: string | null;
  /** True while the ride is paused: the button reads Resume. */
  readonly paused: boolean;
  /** The live readouts, `--` when missing (L2-092). */
  readonly metrics: WorldRideMetrics;
  /** The current segment; null with no workout (L2-093). */
  readonly segment: WorldRideSegment | null;
  /** The resistance panel (L2-096). */
  readonly resistance: WorldRideResistance;
}

/** The resistance panel: the level, its caption and which steps are allowed (L2-096). */
export interface WorldRideResistance {
  readonly level: string;
  /** `Resistance / 32`, or `Manual` in manual mode. */
  readonly caption: string;
  readonly lowerDisabled: boolean;
  readonly raiseDisabled: boolean;
}

/** The current-segment panel's words (L2-093). */
export interface WorldRideSegment {
  /** `Work · 1 of 8`, `Recover · 1 of 8`, `Warm-up`, `Cool-down` or `Steady`. */
  readonly label: string;
  readonly tone: 'work' | 'rest' | 'easy';
  /** `Next: <name> · <m:ss> at level <n>`, or `Last stretch to the finish arch`. */
  readonly next: string;
}

/** The metrics panel: estimated power against target, cadence, heart and speed (L2-092). */
export interface WorldRideMetrics {
  readonly power: string;
  readonly target: string;
  /** `On target`, `+<n> W`, `-<n> W` or `Paused`, with its tone; null with no reading. */
  readonly delta: { readonly text: string; readonly tone: 'on' | 'high' | 'low' } | null;
  readonly cadence: string;
  readonly heart: string;
  readonly speed: string;
}

/** The segment's countdown, interpolated as the dashboard's (L2-024). */
export interface WorldRideCountdown {
  /** The time left, `m:ss`. */
  readonly left: string;
  /** Whole seconds ridden of the segment, out of `duration`. */
  readonly ridden: number;
  readonly duration: number;
  /** The bar's width, e.g. `50.00%`. */
  readonly width: string;
}

/** The ride's clock, `<elapsed> / <total>`, interpolated as the dashboard's (L2-024). */
export interface WorldRideClock {
  readonly elapsed: string;
  readonly total: string;
}

/**
 * The World Ride block: the HUD drawn over a class's scene (L2-090 to L2-097). The scene is
 * projected into `[slot=scene]`. Links carry real `href`s; a plain click is emitted as `navigate`
 * so the page routes without the component knowing the router.
 */
@Component({
  selector: 'wz-world-ride',
  imports: [Icon],
  templateUrl: './world-ride.html',
  styleUrl: './world-ride.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldRide {
  readonly view = input.required<WorldRideView>();
  readonly clock = input.required<WorldRideClock>();
  readonly countdown = input.required<WorldRideCountdown>();
  /** Where `Class` leads: the class page. */
  readonly classHref = input.required<string>();
  /** Where the lockup leads: the dashboard. */
  readonly homeHref = input('/');

  readonly pauseToggled = output<void>();
  readonly endRequested = output<void>();
  /** − or + on the resistance panel. */
  readonly stepped = output<-1 | 1>();
  /** A plain click on a link, with its `href`. */
  readonly navigate = output<string>();

  protected follow(event: MouseEvent, href: string): void {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.navigate.emit(href);
  }
}
