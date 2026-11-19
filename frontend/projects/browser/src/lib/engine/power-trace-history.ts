// The power of each running second, newest
// 10 800 kept, oldest first (L2-050).
export interface PowerSample {
  rideSeconds: number;
  power: number;
}

export const TRACE_CAPACITY = 10_800;

export class PowerTraceHistory {
  private samples: PowerSample[] = [];

  reset(): void {
    this.samples = [];
  }

  append(rideSeconds: number, power: number): void {
    this.samples.push({ rideSeconds, power });
    if (this.samples.length > TRACE_CAPACITY) this.samples.shift();
  }

  snapshot(): PowerSample[] {
    return [...this.samples];
  }
}
