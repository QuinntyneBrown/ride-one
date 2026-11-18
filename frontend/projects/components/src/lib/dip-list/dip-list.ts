import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** One cadence dip as its row reads (L2-085 AC9). */
export interface DipRow {
  readonly time: string;
  readonly what: string;
  readonly detail: string;
  readonly drop: string;
  readonly dropLabel: string;
}

/** The dip list's text: the share on target, the lead line and one row per dip. */
export interface DipListView {
  readonly onTarget: string;
  readonly lead: string;
  readonly rows: readonly DipRow[];
}

/** Every cadence dip of a ride; hovering or focusing a row highlights it on the traces (L2-085). */
@Component({
  selector: 'wz-dip-list',
  templateUrl: './dip-list.html',
  styleUrl: './dip-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DipList {
  readonly view = input.required<DipListView>();
  /** The index of the hovered or focused dip, or null when none is (AC10). */
  readonly focusDip = output<number | null>();
}
