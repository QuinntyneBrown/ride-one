// The browser copy of the run's reported speed and incline: [ride second, speed × 10, incline],
// oldest first (L2-071 criterion 6). GET /api/workout/trace serves power only, so after a reload
// the history starts again from the reload.
import { TRACE_CAPACITY } from './power-trace-history';

export class TreadmillTraceHistory {
  readonly seconds = new Int32Array(TRACE_CAPACITY);
  /** The speed in tenths of km/h, the trace series' values. */
  readonly values = new Int32Array(TRACE_CAPACITY);
  readonly inclines = new Int8Array(TRACE_CAPACITY);
  private count = 0;

  get length(): number {
    return this.count;
  }

  /** The last ride second held, or -1 when empty. */
  get last(): number {
    return this.count ? this.seconds[this.count - 1] : -1;
  }

  clear(): void {
    this.count = 0;
  }

  /** Adds one running second; a second already held is ignored, and going back clears first. */
  append(second: number, speedKmh: number | null, incline: number | null): boolean {
    if (this.count && second === this.last) return false;
    if (this.count && second < this.last) this.count = 0;
    if (this.count === TRACE_CAPACITY) {
      this.seconds.copyWithin(0, 1);
      this.values.copyWithin(0, 1);
      this.inclines.copyWithin(0, 1);
      this.count--;
    }
    this.seconds[this.count] = second;
    this.values[this.count] = Math.max(0, Math.round((speedKmh ?? 0) * 10));
    this.inclines[this.count] = Math.max(0, Math.round(incline ?? 0));
    this.count++;
    return true;
  }
}
