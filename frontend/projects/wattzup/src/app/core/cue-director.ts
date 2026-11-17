// Dashboard-scoped: turns segment changes and the last seconds into the banner, the polite
// announcement, the pulse and tones (L2-027, L2-041).
import {
  Injectable,
  type OnDestroy,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import type { PhaseBannerView } from '@wattzup/components';
import { countdownCue } from './countdown-cue';
import { CountdownService } from './countdown.service';
import { CueService } from './cue.service';
import { announcement, bannerText } from './cue-text';
import { LiveStateService } from './live-state.service';
import { SegmentChangeDetector } from './segment-change-detector';

export const BANNER_MS = 1800;

export type { PhaseBannerView };

@Injectable()
export class CueDirector implements OnDestroy {
  private readonly live = inject(LiveStateService);
  private readonly countdown = inject(CountdownService);
  private readonly cues = inject(CueService);
  private readonly detector = new SegmentChangeDetector();

  private readonly _banner = signal<PhaseBannerView | null>(null);
  private readonly _announcement = signal('');
  readonly banner = this._banner.asReadonly();
  readonly announcement = this._announcement.asReadonly();

  private readonly running = computed(() => this.live.state()?.workout?.status === 'running');
  private readonly segmentKey = computed(() => {
    const w = this.live.state()?.workout;
    return w ? `${w.summary}|${w.total_seconds}|${w.segment}` : '';
  });
  readonly pulse = computed(() => countdownCue(this.countdown.wholeLeft(), this.running()).pulse);

  private bannerTimer: ReturnType<typeof setTimeout> | null = null;
  private nextId = 1;
  private lastBeep = '';

  constructor() {
    effect(() => {
      const workout = this.live.state()?.workout ?? null;
      untracked(() => {
        const change = this.detector.observe(workout);
        if (!change) return;
        const text = bannerText(change);
        this._banner.set({ id: this.nextId++, ...text, rest: change.kind !== 'work' });
        this._announcement.set(announcement(change));
        this.cues.play(change.kind === 'work' ? 'work' : 'change');
        if (this.bannerTimer) clearTimeout(this.bannerTimer);
        this.bannerTimer = setTimeout(() => this._banner.set(null), BANNER_MS);
      });
    });
    effect(() => {
      const left = this.countdown.wholeLeft();
      const running = this.running();
      const key = `${this.segmentKey()}|${left}`;
      untracked(() => {
        if (!countdownCue(left, running).beep || key === this.lastBeep) return;
        this.lastBeep = key;
        this.cues.play('countdown');
      });
    });
  }

  ngOnDestroy(): void {
    if (this.bannerTimer) clearTimeout(this.bannerTimer);
  }
}
