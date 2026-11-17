import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { RideOverlayText } from '../../core/ride-overlay-text';
import { Icon } from '@wattzup/components';

/** The veil over the dashboard when the machine can't be used, and the belt overlays (L2-058,
 * L2-071). */
@Component({
  selector: 'wz-ride-overlay',
  imports: [Icon, RouterLink],
  templateUrl: './ride-overlay.html',
  styleUrl: './ride-overlay.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideOverlay {
  readonly overlay = input.required<RideOverlayText>();
  readonly reconnecting = input(false);
  readonly reconnect = output();
  readonly diagnostics = output();
  readonly resumeRide = output();
}
