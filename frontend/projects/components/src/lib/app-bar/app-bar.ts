import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Machine, WorkoutSnapshot } from '@wattzup/api';
import { Icon } from '../icon/icon';
import { RideClock } from '../ride-clock/ride-clock';
import { type ConnectionStatus, StatusLine } from '../status-line/status-line';

/** The small status label beside the clock, `Paused` and the like. */
export interface AppBarBadge {
  text: string;
  tone: 'info' | 'warning' | 'danger';
}

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
  /** Skeletons stand in for the status and the clock while the ride loads. */
  readonly loading = input(false);
  readonly pauseEnabled = input(false);
  readonly endEnabled = input(false);
  readonly status = input.required<ConnectionStatus>();
  readonly reducedMotion = input(false);
  /** The elapsed ride time as shown. */
  readonly elapsed = input('0:00');
  readonly badge = input<AppBarBadge | null>(null);
  /** Countdown beeps on. */
  readonly beeps = input(false);
  readonly theme = input<'dark' | 'light'>('dark');
  /** Where the lockup goes. */
  readonly homeLink = input.required<string>();
  /** Where the workout button goes. */
  readonly setupLink = input.required<string>();

  readonly pauseRide = output();
  readonly resumeRide = output();
  readonly endRide = output();
  readonly toggleBeeps = output();
  readonly toggleTheme = output();
  readonly diagnostics = output();

  protected readonly paused = computed(() => {
    const status = this.workout()?.status;
    return status === 'paused' || status === 'paused: belt stopped';
  });
}
