import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Segment } from '@telo/api';
import { formatClock } from '../metric/format-clock';
import { ClassProfile } from './class-profile';

/**
 * A class card of the Class Library (design-system block class-card): the cover with the class's length, its resistance
 * profile, its title and "{channel} · {focus}" (L2-081 AC4). The page puts it on a link to the class's Class Start;
 * Telo Ride 1 locks no class (ADR 0039).
 */
@Component({
  selector: 'a[wz-class-card]',
  imports: [ClassProfile],
  templateUrl: './class-card.html',
  styleUrl: './class-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'class-card' },
})
export class ClassCard {
  readonly title = input.required<string>();
  readonly channel = input.required<string>();
  readonly focus = input.required<string>();
  readonly cover = input.required<string>();
  readonly lengthSeconds = input.required<number>();
  readonly segments = input.required<readonly Segment[]>();

  protected readonly time = computed(() => formatClock(this.lengthSeconds()));
}
