import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ProfileTone = 'is-work' | 'is-rest' | 'is-easy';

export interface ProfileBar {
  x: number;
  width: number;
  y: number;
  height: number;
  tone: ProfileTone;
}

export interface SummaryRow {
  term: string;
  value: string;
}

/** The incline profile under a run's speed profile: 0 to 10 % on the same time axis. */
export interface InclineProfile {
  label: string;
  /** `x,y` points of the line, y = 10 − incline. */
  line: string;
  /** The line closed down to the axis. */
  area: string;
}

/** What the panel shows, for either machine. */
export interface RidePreview {
  totalSeconds: number;
  total: string;
  structure: string;
  timeUnderLoad: string | null;
  profileLabel: string;
  profile: ProfileBar[];
  /** The profile's view box height: 32 for the bike, 193 (19.3 km/h × 10) for the run. */
  profileHeight: number;
  /** The run's incline profile; null on the bike. */
  incline: InclineProfile | null;
  /** `Your ride` or `Your run`. */
  noun: 'ride' | 'run';
  rows: SummaryRow[];
  legend: ('work' | 'rest' | 'steady')[];
}

/** The Your ride panel's total, profile, summary and legend (L2-059, L2-072). */
@Component({
  selector: 'wz-ride-profile',
  templateUrl: './ride-profile.html',
  styleUrl: './ride-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RideProfile {
  /** The last valid preview; kept while the form is invalid. */
  readonly preview = input<RidePreview | null>(null);
  readonly valid = input(true);
  /** `run` on the treadmill; kept while the form is invalid, as the machine does not change. */
  readonly machineNoun = input<'ride' | 'run'>('ride');
  protected readonly noun = computed(() => this.preview()?.noun ?? this.machineNoun());

  protected readonly total = computed(() => (this.valid() ? (this.preview()?.total ?? '—') : '—'));
  protected readonly legendLabels = { work: 'Work', rest: 'Recover', steady: 'Steady' } as const;
}
