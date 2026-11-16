import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { WorkoutSnapshot } from '../../core/api-types';
import type { RideViewState } from '../../core/ride-view-state';
import { statusBadge } from '../../core/segment-labels';
import { CueService } from '../../core/cue.service';
import { DialogLauncher } from '../../core/dialog-launcher';
import { RideActions } from '../../core/ride-actions';
import { Icon } from '../icon/icon';
import { RideClock } from '../ride-clock/ride-clock';
import { StatusLine } from '../status-line/status-line';

/** The ride dashboard's app bar, in DOM order = Tab order (L2-041). */
@Component({
  selector: 'wz-app-bar',
  imports: [RouterLink, StatusLine, RideClock, Icon],
  templateUrl: './app-bar.html',
  styleUrl: './app-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBar {
  readonly workout = input<WorkoutSnapshot | null>(null);
  readonly view = input.required<RideViewState>();
  protected readonly actions = inject(RideActions);
  protected readonly dialogs = inject(DialogLauncher);
  protected readonly cues = inject(CueService);

  protected readonly badge = computed(() => {
    const w = this.workout();
    return w ? statusBadge(w.status) : null;
  });
  protected readonly paused = computed(() => this.workout()?.status === 'paused');
}
