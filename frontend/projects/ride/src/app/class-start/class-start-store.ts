import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CLASSES_API, type ClassDto, VIDEO_PLAYER_FACTORY, type VideoPlayer } from '@telo/api';
import type { RideOption } from '@telo/components';
import { PlanSummary } from '@telo/domain';

/**
 * Class Start's state, provided on its page (docs/detailed-designs/classes/start-a-class): the class of the address,
 * read from `CLASSES_API` (the device's copy when the backend cannot be reached), what the page says of it, and its
 * video parked at the sync offset. It goes, with the player, when the rider leaves.
 */
@Injectable()
export class ClassStartStore {
  private readonly loaded = signal<ClassDto | null>(null);
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private player: VideoPlayer | null = null;
  private videoHost: HTMLElement | null = null;
  private destroyed = false;

  /** The class, once it has arrived. */
  readonly dto = this.loaded.asReadonly();

  /** "GCN Training · 30 min · HIIT" (L2-084 AC1). */
  readonly meta = computed(() => {
    const dto = this.loaded();
    return dto ? `${dto.channel} · ${Math.round(dto.lengthSeconds / 60)} min · ${dto.focus}` : '';
  });

  /**
   * The ways to ride (L2-085): alone, chosen; with a group, which cannot be chosen until group sessions can be read
   * (slices 14.2 and 14.3, L2-085 AC5).
   */
  readonly options: readonly RideOption[] = [
    {
      id: 'alone',
      title: 'Ride alone',
      body: 'Start now. Pause whenever you like.',
      icon: 'alone',
      disabled: false,
    },
    {
      id: 'group',
      title: 'Ride with a group',
      body: 'Group sessions can’t be reached right now.',
      icon: 'group',
      disabled: true,
    },
  ];

  /** The chosen way to ride. */
  readonly mode = signal('alone');

  /** "8 × 0:30 · 3:00 → 1:30 recover · ~154 W average" (L2-084 AC2). */
  readonly planSummary = computed(() => {
    const segments = this.loaded()?.plan.segments ?? [];
    return `${PlanSummary.structure(segments)} · ~${PlanSummary.averagePower(segments)} W average`;
  });

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    inject(CLASSES_API)
      .get(id)
      .pipe(takeUntilDestroyed())
      .subscribe((dto) => this.loaded.set(dto));
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.player?.destroy();
    });
  }

  /**
   * Parks the class video in `host` at its sync offset with YouTube's controls, waiting for the rider (L2-084 AC1);
   * called once the frame is drawn.
   */
  parkVideo(host: HTMLElement): void {
    const dto = this.loaded();
    if (!dto || this.videoHost) return;
    this.videoHost = host;
    this.playerFactory().then(
      (player) => {
        if (this.destroyed) return player.destroy();
        this.player = player;
        void player.load(host, dto.video.videoId, {
          startSeconds: dto.video.syncOffsetSeconds,
          controls: true,
          autoplay: false,
          title: `Video: ${dto.title}`,
        });
      },
      // Without the player the cover stays, and the class can still be ridden.
      () => undefined,
    );
  }
}
