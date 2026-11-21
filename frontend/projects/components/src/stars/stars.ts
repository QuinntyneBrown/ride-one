import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Stars (design-system block stars): `count` stars, the first `earned` filled in gold, as one image named "{earned} of
 * {count} stars", so the number never rests on colour alone (L2-039, L2-046 AC2).
 */
@Component({
  selector: 'wz-stars',
  templateUrl: './stars.html',
  styleUrl: './stars.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'stars',
    role: 'img',
    '[class.stars--md]': "size() === 'md'",
    '[attr.aria-label]': 'label()',
  },
})
export class Stars {
  readonly earned = input.required<number>();
  readonly count = input(3);
  readonly size = input<'sm' | 'md'>('md');

  protected readonly label = computed(() => `${this.earned()} of ${this.count()} stars`);
  protected readonly slots = computed(() =>
    Array.from({ length: this.count() }, (_, index) => index < this.earned()),
  );
}
