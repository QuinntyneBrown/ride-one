import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One map on Map Select (design-system block map-row), on the page's link to Race Setup when the map is open or on
 * its disabled button when it is locked (L2-046 AC2 to AC4). The page projects the map's name, its accessible name.
 */
@Component({
  selector: 'a[wz-map-row], button[wz-map-row]',
  templateUrl: './map-row.html',
  styleUrl: './map-row.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'map-row',
    '[class.map-row--next]': "state() === 'next'",
    '[class.map-row--locked]': "state() !== 'open'",
  },
})
export class MapRow {
  readonly state = input.required<'open' | 'next' | 'locked'>();
}
