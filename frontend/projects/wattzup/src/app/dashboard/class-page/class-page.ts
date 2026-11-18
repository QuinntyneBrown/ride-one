import {
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CLASS_API, type ClassEntry } from '@wattzup/api';
import { Icon, LevelRow, StatusLine } from '@wattzup/components';
import {
  cadenceLine,
  type ClassDraft,
  draftOf,
  levelRows,
  stretchLine,
  structureLine,
} from '../../core/class-draft';
import { liveConnectionStatus } from '../../core/connection-status';
import { bikeOnly } from '../../core/machine-guards';
import { MotionPreference } from '../../core/motion-preference';
import { previewOf } from '../../core/ride-preview';
import { formatStart, videoIdOf } from '../../core/video-link';
import { type PlayerHandle, YOUTUBE_PLAYER } from '../../core/youtube-player';

type Phase = 'loading' | 'ready' | 'not-found';

/** Route `/classes/:id`: one class, its video and plan, and Start ride (L2-080). */
@Component({
  selector: 'wz-class-page',
  imports: [Icon, LevelRow, RouterLink, StatusLine],
  templateUrl: './class-page.html',
  styleUrl: './class-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClassPage {
  /** The route's `:id`. */
  readonly id = input.required<string>();

  private readonly classes = inject(CLASS_API);
  private readonly players = inject(YOUTUBE_PLAYER);
  private readonly title = inject(Title);

  protected readonly status = liveConnectionStatus();
  protected readonly reducedMotion = inject(MotionPreference).reduced;
  protected readonly phase = signal<Phase>('loading');
  protected readonly entry = signal<ClassEntry | null>(null);
  protected readonly draft = signal<ClassDraft | null>(null);

  protected readonly preview = computed(() => {
    const d = this.draft();
    return d ? previewOf(d.plan) : null;
  });
  protected readonly rows = computed(() => {
    const d = this.draft();
    return d ? levelRows(d.plan) : [];
  });
  protected readonly lines = computed(() => {
    const d = this.draft();
    return d
      ? {
          structure: structureLine(d.plan),
          cadence: cadenceLine(d.plan),
          stretches: stretchLine(d.plan),
        }
      : null;
  });
  protected readonly videoId = computed(() => {
    const d = this.draft();
    return d ? videoIdOf(d.url) : null;
  });
  protected readonly startText = computed(() => formatStart(this.draft()?.start ?? 0));
  protected readonly legendLabels = { work: 'Work', rest: 'Recover', steady: 'Steady' } as const;

  private readonly host = viewChild<ElementRef<HTMLElement>>('host');
  private readonly player = signal<PlayerHandle | null>(null);

  constructor() {
    bikeOnly();
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
    // The preview: the YouTube player cued at the start point (L2-080 AC2).
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
          untracked(() => this.draft()?.start ?? 0),
        )
        .then((h) => {
          if (gone) return h.destroy();
          handle = h;
          this.player.set(h);
        })
        .catch(() => undefined);
    });
  }

  private async load(id: string): Promise<void> {
    this.phase.set('loading');
    try {
      const entry = await this.classes.get(id);
      if (entry === 'not-found') {
        this.phase.set('not-found');
        this.title.setTitle('Class not found · Wattzup');
        return;
      }
      this.entry.set(entry);
      this.draft.set(draftOf(entry));
      this.title.setTitle(`${entry.title} · Wattzup`);
      this.phase.set('ready');
    } catch {
      this.phase.set('not-found');
    }
  }
}
