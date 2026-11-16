// Dashboard-scoped: one CountdownClock shared by the interval card and the ride clock,
// re-anchored on every streamed state and read on every frame (L2-024).
import { Injectable, type OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { CountdownClock } from './countdown-clock';
import { formatDuration } from './format-duration';
import { FrameScheduler } from './frame-scheduler';
import { LiveStateService } from './live-state.service';
import { MotionPreference } from './motion-preference';

@Injectable()
export class CountdownService implements OnDestroy {
  private readonly live = inject(LiveStateService);
  private readonly frames = inject(FrameScheduler);
  private readonly reduced = inject(MotionPreference).reduced;
  private readonly clock = new CountdownClock();
  private readonly version = signal(0);
  private stopLoop: (() => void) | null = null;

  private readonly at = computed(() => {
    this.version();
    return Math.max(this.frames.now(), this.anchorAt);
  });
  private anchorAt = 0;

  readonly remaining = computed(() => this.clock.remainingAt(this.at()));
  /** Whole seconds left, rounded up, as the countdown shows them. */
  readonly wholeLeft = computed(() => Math.ceil(this.remaining() - 1e-9));
  readonly remainingText = computed(() => formatDuration(this.wholeLeft()));
  readonly elapsedText = computed(() =>
    formatDuration(Math.floor(this.clock.elapsedAt(this.at()))),
  );
  readonly progress = computed(() => {
    if (this.reduced()) {
      const w = this.live.state()?.workout;
      const duration = w?.segments[w.segment]?.duration ?? 0;
      return duration > 0 ? (duration - this.wholeLeft()) / duration : 0;
    }
    return this.clock.progressAt(this.at());
  });

  constructor() {
    effect(() => {
      const workout = this.live.state()?.workout ?? null;
      this.anchorAt = performance.now();
      this.clock.anchor(workout, this.anchorAt);
      this.version.update((v) => v + 1);
      const running = workout?.status === 'running';
      if (running && !this.stopLoop) this.stopLoop = this.frames.startLoop();
      if (!running && this.stopLoop) {
        this.stopLoop();
        this.stopLoop = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.stopLoop?.();
  }
}
