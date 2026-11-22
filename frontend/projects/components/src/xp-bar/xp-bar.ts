import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * The XP bar (block xp-bar, docs/design-system/): a gold fill on a raised track, filled to `fillPercent` (0 to 100) through
 * `--value`. It carries no label of its own; the text beside it names the XP.
 */
@Component({
  selector: 'wz-xp-bar',
  templateUrl: './xp-bar.html',
  styleUrl: './xp-bar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'xp-bar', '[style.--value]': 'value()' },
})
export class XpBar {
  readonly fillPercent = input.required<number>();

  protected readonly value = computed(() => `${this.fillPercent()}%`);
}
