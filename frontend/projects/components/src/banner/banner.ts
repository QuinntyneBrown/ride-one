import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * A notice above a page's content (block banner, docs/design-system/assets/components.css): its icon, a bold title and
 * a muted detail, and the page's action in the `action` slot, announced politely as a status. `gold` marks an unlock
 * (Home's unlocked banner, L2-036), with the lock opening as its icon so the tone never rests on colour alone.
 */
@Component({
  selector: 'wz-banner',
  templateUrl: './banner.html',
  styleUrl: './banner.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'status', class: 'banner', '[class.banner--gold]': "tone() === 'gold'" },
})
export class Banner {
  readonly title = input.required<string>();
  readonly detail = input('');
  readonly tone = input<'gold'>('gold');
}
