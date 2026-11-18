import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** One attempt on the trend: a link to its session (L2-086 AC4). */
export interface TrendPoint {
  readonly id: string;
  readonly label: string;
  /** Percentages of the plot's width and height. */
  readonly x: number;
  readonly y: number;
  readonly latest: boolean;
}

/** A label along an axis of the trend, as a percentage of its length. */
export interface TrendLabel {
  readonly text: string;
  readonly at: number;
}

/** Everything the trend chart shows, computed by the page (L2-086 AC3, AC4). */
export interface TrendView {
  readonly label: string;
  readonly value: string;
  readonly unit: string;
  readonly change: string;
  readonly tone: 'better' | 'worse' | 'same';
  readonly since: string;
  readonly gridlines: readonly TrendLabel[];
  /** Polyline points in a 100 × 100 box. */
  readonly line: string;
  readonly points: readonly TrendPoint[];
  readonly xLabels: readonly TrendLabel[];
}

/** One class's attempts by one measure, oldest left; the latest point is larger (L2-086). */
@Component({
  selector: 'wz-trend-chart',
  templateUrl: './trend-chart.html',
  styleUrl: './trend-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrendChart {
  readonly view = input.required<TrendView>();
  /** A plain click on a session link: the page routes to `/sessions/<id>`. */
  readonly open = output<string>();

  protected onClick(event: MouseEvent, id: string): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    this.open.emit(id);
  }
}
