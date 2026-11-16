import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { RidePreview as Preview } from '../../core/ride-preview';

/** The Your ride panel's total, profile, summary and legend (L2-059). */
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

  protected readonly total = computed(() => (this.valid() ? (this.preview()?.total ?? '—') : '—'));
  protected readonly legendLabels = { work: 'Work', rest: 'Recover', steady: 'Steady' } as const;
}
