import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';

export type RideOverlayKind =
  | 'scanning'
  | 'adapter-off'
  | 'bike-lost'
  | 'bike-shut-off'
  | 'belt-countdown'
  | 'belt-starting'
  | 'belt-stopped';

export interface RideOverlayText {
  kind: RideOverlayKind;
  role: 'status' | 'alert' | null;
  icon: 'bluetooth-off' | 'flag' | 'key' | null;
  /** The belt countdown's 3, 2 or 1, shown large and hidden from assistive technology. */
  count: number | null;
  title: string;
  lines: string[];
  note: string | null;
}

/** The veil over the dashboard when the machine can't be used, and the belt overlays (L2-058,
 * L2-071). */
@Component({
  selector: 'wz-overlay-panel',
  imports: [Icon, RouterLink],
  templateUrl: './overlay-panel.html',
  styleUrl: './overlay-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayPanel {
  readonly overlay = input.required<RideOverlayText>();
  readonly reconnecting = input(false);
  /** Where `Set up a new ride` goes. */
  readonly setupLink = input.required<string>();
  readonly reconnect = output();
  readonly diagnostics = output();
  readonly resumeRide = output();
}
