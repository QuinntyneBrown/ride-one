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
  /** Where `Class` leads: the class page. */
  readonly classHref = input.required<string>();
  /** Where the lockup leads: the dashboard. */
  readonly homeHref = input('/');

  readonly pauseToggled = output<void>();
  readonly endRequested = output<void>();
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
