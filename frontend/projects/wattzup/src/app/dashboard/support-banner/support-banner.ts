import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BIKE_PAIRING } from '@wattzup/api';
import { Alert } from '@wattzup/components';
import { supportNotice } from '../../core/support-notice';

/** The banner under the header of setup and a class page when the page cannot reach
 * Bluetooth (L2-089). The page stays usable; only starting a ride is blocked. */
@Component({
  selector: 'wz-support-banner',
  imports: [Alert],
  templateUrl: './support-banner.html',
  styleUrl: './support-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportBanner {
  private readonly pairing = inject(BIKE_PAIRING);
  protected readonly notice = computed(() => supportNotice(this.pairing.support(), location.href));
  /** Copy link reads Link copied for 1.6 s, as on the ride dashboard. */
  protected readonly copied = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(location.href);
    } catch {
      return;
    }
    this.copied.set(true);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copied.set(false), 1600);
  }
}
