import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** One total of a ride: its label, value and unit (L2-085 AC11). */
export interface Stat {
  readonly label: string;
  readonly value: string;
  readonly unit: string | null;
}

/** A session's totals as labelled numerals (L2-085 AC11). */
@Component({
  selector: 'wz-stat-strip',
  templateUrl: './stat-strip.html',
  styleUrl: './stat-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatStrip {
  readonly stats = input.required<readonly Stat[]>();
}
