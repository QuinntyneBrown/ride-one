import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A horizontal stretch of a trace, in ride seconds. */
export interface TraceSpan {
  readonly x: number;
  readonly width: number;
}

/** The dashed aim of a counted segment, in ride seconds and chart units. */
export interface TraceAim {
  readonly x1: number;
  readonly x2: number;
  readonly y: number;
}

/** A label placed along an axis, as a percentage of its length. */
export interface TraceLabel {
  readonly text: string;
  readonly at: number;
}

/**
 * Everything the session traces draw, precomputed by the page (L2-085 AC8). The cadence chart is
 * `total` seconds wide and 80 units high (40 to 120 rpm); the power chart `total` by `powerMax` W.
 */
export interface TracesView {
  readonly label: string;
  readonly total: number;
  readonly cadence: string;
  readonly aims: readonly TraceAim[];
  readonly bands: readonly TraceSpan[];
  readonly grid: readonly number[];
  readonly yLabels: readonly TraceLabel[];
  readonly power: string;
  readonly powerMax: number;
  readonly work: readonly TraceSpan[];
  readonly ticks: readonly TraceLabel[];
}

/** Cadence against its aim with every dip marked, and power beneath on one clock (L2-085). */
@Component({
  selector: 'wz-session-traces',
  templateUrl: './session-traces.html',
  styleUrl: './session-traces.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionTraces {
  readonly view = input.required<TracesView>();
  /** The dip highlighted by the dip list, or null (L2-085 AC10). */
  readonly focusDip = input<number | null>(null);
}
