import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  MAX_START_SECONDS,
  formatStart,
  linkError,
  parseStart,
  stepStart,
  type VideoDraft,
  videoIdOf,
} from '../../core/video-link';
import { type PlayerHandle, YOUTUBE_PLAYER } from '../../core/youtube-player';
import { Icon, NumberStepper } from '@wattzup/components';

/**
 * The ride-along video on the setup screen: the `Ride along to a video` switch and, when on, the
 * YouTube link field; for a YouTube link, a preview and the start point (L2-029 criteria 17 to 19,
 * ADR 0012).
 */
@Component({
  selector: 'wz-video-link',
  imports: [Icon, NumberStepper],
  templateUrl: './video-link.html',
  styleUrl: './video-link.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VideoLink {
  private readonly players = inject(YOUTUBE_PLAYER);
  readonly draft = model.required<VideoDraft>();
  readonly disabled = input(false);

  protected readonly error = computed(() => linkError(this.draft()));
  protected readonly videoId = computed(() =>
    this.draft().on ? videoIdOf(this.draft().url) : null,
  );
  /** The start point as typed; committed on Enter or leaving the field. */
  protected readonly startText = linkedSignal(() => formatStart(this.draft().start));
  private readonly host = viewChild<ElementRef<HTMLElement>>('host');
  private readonly player = signal<PlayerHandle | null>(null);

  constructor() {
    effect((onCleanup) => {
      const id = this.videoId();
      const host = this.host()?.nativeElement;
      if (!id || !host) return;
      let handle: PlayerHandle | null = null;
      let gone = false;
      onCleanup(() => {
        gone = true;
        handle?.destroy();
        this.player.set(null);
      });
      this.players
        .create(
          host,
          id,
          untracked(() => this.draft().start),
        )
        .then((h) => {
          if (gone) return h.destroy();
          handle = h;
          this.player.set(h);
        })
        .catch(() => undefined);
    });
  }

  protected setOn(on: boolean): void {
    this.draft.update((d) => ({ ...d, on }));
  }

  protected setUrl(url: string): void {
    this.draft.update((d) => ({ ...d, url }));
  }

  private setStart(start: number): void {
    this.draft.update((d) => ({ ...d, start }));
    this.player()?.seek(start);
  }

  protected commitStart(): void {
    const start = parseStart(this.startText());
    if (start === null) this.startText.set(formatStart(this.draft().start));
    else if (start !== this.draft().start) this.setStart(start);
    else this.startText.set(formatStart(start));
  }

  protected step(dir: 1 | -1): void {
    this.setStart(stepStart(this.draft().start, dir));
  }

  /** Pauses the preview and takes its time as the start point. */
  protected useCurrentTime(): void {
    const p = this.player();
    if (!p) return;
    p.pause();
    const t = Math.round(p.currentTime() * 10) / 10;
    this.setStart(Math.min(MAX_START_SECONDS, Math.max(0, t)));
  }

  /** Plays the preview from the start point. */
  protected check(): void {
    const p = this.player();
    if (!p) return;
    p.seek(this.draft().start);
    p.play();
  }
}
