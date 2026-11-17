// The dashboard's only requestAnimationFrame caller (L2-028, L2-038). It coalesces draw
// requests to one per frame, drives the countdown's frame signal, and requests no frame
// while the tab is hidden.
import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FrameScheduler {
  private readonly document = inject(DOCUMENT);
  private readonly _now = signal(performance.now());
  /** The time of the latest frame while the loop runs. */
  readonly now = this._now.asReadonly();

  private readonly draws = new Set<() => void>();
  private loops = 0;
  private handle: number | null = null;

  constructor() {
    this.document.addEventListener('visibilitychange', () => {
      if (this.document.hidden) this.cancel();
      else this.schedule();
    });
  }

  /** Keeps `now` ticking every frame until the returned function is called. */
  startLoop(): () => void {
    this.loops++;
    this.schedule();
    let stopped = false;
    return () => {
      if (stopped) return;
      stopped = true;
      this.loops--;
    };
  }

  /** Runs `draw` on the next frame; several requests in one frame run it once. */
  requestDraw(draw: () => void): void {
    this.draws.add(draw);
    this.schedule();
  }

  private schedule(): void {
    if (this.handle !== null || this.document.hidden) return;
    if (this.loops === 0 && this.draws.size === 0) return;
    this.handle = requestAnimationFrame((time) => this.frame(time));
  }

  private cancel(): void {
    if (this.handle !== null) cancelAnimationFrame(this.handle);
    this.handle = null;
  }

  private frame(time: number): void {
    this.handle = null;
    if (this.loops > 0) this._now.set(time);
    const draws = [...this.draws];
    this.draws.clear();
    for (const draw of draws) draw();
    this.schedule();
  }
}
