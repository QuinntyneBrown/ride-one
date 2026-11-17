import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { connectionStatus } from '../../core/connection-status';
import { LiveStateService } from '../../core/live-state.service';
import { MotionPreference } from '../../core/motion-preference';
import { Icon } from '@wattzup/components';

/** Icon, name and state label for the connection (L2-018). */
@Component({
  selector: 'wz-status-line',
  imports: [Icon],
  templateUrl: './status-line.html',
  styleUrl: './status-line.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusLine {
  private readonly live = inject(LiveStateService);
  protected readonly reducedMotion = inject(MotionPreference).reduced;
  protected readonly status = computed(() =>
    connectionStatus(this.live.state(), this.live.connection(), this.live.loadFailed()),
  );
}
