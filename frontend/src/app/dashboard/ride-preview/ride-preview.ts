import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { RidePreview as Preview } from '../../core/ride-preview';

/** The Your ride panel's total, profile, summary and legend (L2-059, L2-072). */
@Component({
  selector: 'wz-ride-preview',
  templateUrl: './ride-preview.html',
  styleUrl: './ride-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RidePreview {
  /** The last valid preview; kept while the form is invalid. */
  readonly preview = input<Preview | null>(null);
  readonly valid = input(true);
  /** `run` on the treadmill; kept while the form is invalid, as the machine does not change. */
  readonly machineNoun = input<'ride' | 'run'>('ride');
  protected readonly noun = computed(() => this.preview()?.noun ?? this.machineNoun());

  protected readonly total = computed(() => (this.valid() ? (this.preview()?.total ?? '—') : '—'));
  protected readonly legendLabels = { work: 'Work', rest: 'Recover', steady: 'Steady' } as const;
}
