import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ConnectionBannerService } from '../../core/connection-banner.service';
import type { Banner } from '../../core/connection-banners';
import { DialogLauncher } from '../../core/dialog-launcher';
import { LiveStateService } from '../../core/live-state.service';
import { Alert } from '../alert/alert';

/** The banners between the app bar and the dashboard (L2-054). */
@Component({
  selector: 'wz-connection-banner',
  imports: [Alert],
  templateUrl: './connection-banner.html',
  styleUrl: './connection-banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConnectionBanner {
  protected readonly service = inject(ConnectionBannerService);
  private readonly live = inject(LiveStateService);
  private readonly dialogs = inject(DialogLauncher);

  protected act(banner: Banner): void {
    if (banner.action?.kind === 'retry') this.live.retryNow();
    else if (banner.action?.kind === 'diagnostics') this.dialogs.openDiagnostics();
  }
}
