import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MapPath, MapPathItem, MapRow } from '@telo/components';
import { MapPathStore } from './map-path-store';

/**
 * Map Select at `/race` (L2-046): "Maps", its lead, and the unlock path of every map in unlock order.
 */
@Component({
  selector: 'wz-map-select-page',
  imports: [MapPath, MapPathItem, MapRow],
  templateUrl: './map-select-page.html',
  styleUrl: './map-select-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MapPathStore],
})
export default class MapSelectPage {
  protected readonly store = inject(MapPathStore);
}
