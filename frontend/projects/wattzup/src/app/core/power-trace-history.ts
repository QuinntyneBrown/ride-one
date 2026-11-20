// The browser copy of the ride's power history: [ride second, watts], oldest first (L2-026, L2-050).
export const TRACE_CAPACITY = 10_800;

export type AppendResult = 'appended' | 'unchanged' | 'gap' | 'restart';

export class PowerTraceHistory {
  readonly seconds = new Int32Array(TRACE_CAPACITY);
  readonly watts = new Int32Array(TRACE_CAPACITY);
  private count = 0;

  /** The watts, as a trace series reads them. */
  get values(): Int32Array {
    return this.watts;
  }

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

  /** Replaces the history with the samples from WORKOUT_API's trace. */
  restore(samples: readonly (readonly number[])[]): void {
    this.count = 0;
    const from = Math.max(0, samples.length - TRACE_CAPACITY);
    for (let i = from; i < samples.length; i++) {
      const [s, p] = samples[i];
      this.seconds[this.count] = s;
      this.watts[this.count] = p;
      this.count++;
    }
  }

  /**
   * Adds one running second. A second already held is ignored; a skip of more than one
   * second asks for a reload, and going back means a new ride.
   */
  append(second: number, watts: number | null): AppendResult {
    const last = this.last;
    if (this.count && second < last) return 'restart';
    if (this.count && second === last) return 'unchanged';
    if (this.count && second > last + 1) return 'gap';
    if (this.count === TRACE_CAPACITY) {
      this.seconds.copyWithin(0, 1);
      this.watts.copyWithin(0, 1);
      this.count--;
    }
    this.seconds[this.count] = second;
    this.watts[this.count] = Math.max(0, Math.round(watts ?? 0));
    this.count++;
    return 'appended';
  }
}
