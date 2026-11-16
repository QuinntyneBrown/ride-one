import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Machine, WorkoutSnapshot } from '../../core/api-types';
import type { RideViewState } from '../../core/ride-view-state';
import { badgeTone, statusBadge } from '../../core/segment-labels';
import { CueService } from '../../core/cue.service';
import { DialogLauncher } from '../../core/dialog-launcher';
import { RideActions } from '../../core/ride-actions';
import { ThemeService } from '../../core/theme.service';
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
  readonly machine = input<Machine>('bike');
  readonly view = input.required<RideViewState>();
  protected readonly actions = inject(RideActions);
  protected readonly dialogs = inject(DialogLauncher);
  protected readonly cues = inject(CueService);
  protected readonly theme = inject(ThemeService);

  protected readonly badge = computed(() => {
    const w = this.workout();
    const text = w ? statusBadge(w.status, this.machine()) : null;
    return w && text ? { text, tone: badgeTone(w.status, this.machine()) } : null;
  });
  /** Resume shows for a pause the rider can lift: paused, or the belt stopped (L2-071 AC9). */
  protected readonly paused = computed(() => {
    const status = this.workout()?.status;
    return status === 'paused' || status === 'paused: belt stopped';
  });
}
