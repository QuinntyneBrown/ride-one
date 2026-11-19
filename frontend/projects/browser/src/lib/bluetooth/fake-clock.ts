// A clock the unit tests advance by hand; no test sleeps (AGENTS.md).
import type { Clock } from './clock';

/** Lets every pending promise chain run, without waiting on a timer. */
async function settle(): Promise<void> {
  for (let i = 0; i < 50; i++) await Promise.resolve();
}

export class FakeClock implements Clock {
  private time = 0;
  private readonly timers: { at: number; resolve: () => void }[] = [];

  now(): number {
    return this.time;
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.timers.push({ at: this.time + ms, resolve }));
  }

  /** Moves time forward by `ms`, resolving each delay due on the way, in order. */
  async advance(ms: number): Promise<void> {
    const end = this.time + ms;
    for (;;) {
      await settle();
      const due = this.timers.filter((t) => t.at <= end).sort((a, b) => a.at - b.at)[0];
      if (!due) break;
      this.timers.splice(this.timers.indexOf(due), 1);
      this.time = due.at;
      due.resolve();
    }
    this.time = end;
    await settle();
  }
}
