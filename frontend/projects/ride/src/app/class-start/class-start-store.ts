import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BIKE_CONNECTION,
  CLASSES_API,
  type ClassDto,
  REMEMBERED_BIKE,
  VIDEO_PLAYER_FACTORY,
  type VideoPlayer,
} from '@telo/api';
import { PlanSummary, bikeStatus } from '@telo/domain';
import { THE_CLASS_ID } from '../classes/the-class';

/**
 * Class Start's state, provided on its page: the one class (`THE_CLASS_ID`), read from `CLASSES_API` (the device's
 * copy when the backend cannot be reached), what the page says of it, its video parked at the sync offset, and the
 * bike's status for the header. With no catalogue to read and none kept it is `unavailable`, and `retry()` asks
 * again. It goes, with the player, when the rider leaves.
 */
@Injectable()
export class ClassStartStore {
  private readonly loaded = signal<ClassDto | null>(null);
  private readonly classes = inject(CLASSES_API);
  private readonly destroyRef = inject(DestroyRef);
  private readonly connection = inject(BIKE_CONNECTION);
  /** The bike this browser remembers names the status before the connection has one (L2-015). */
  private readonly remembered = inject(REMEMBERED_BIKE).get();
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private player: VideoPlayer | null = null;
  private videoHost: HTMLElement | null = null;
  private destroyed = false;

  /** The class, once it has arrived. */
  readonly dto = this.loaded.asReadonly();

  /** The class could not be read and no copy is kept on the device. */
  readonly unavailable = signal(false);

  /** The header's bike status (L2-019). */
  readonly bike = computed(() =>
    bikeStatus(this.connection.ble(), (this.connection.bike() ?? this.remembered)?.name ?? null),
  );

  /** "GCN Training · 30 min · HIIT" (L2-084 AC1). */
  readonly meta = computed(() => {
    const dto = this.loaded();
    return dto ? `${dto.channel} · ${Math.round(dto.lengthSeconds / 60)} min · ${dto.focus}` : '';
  });

  /** "8 × 0:30 · 3:00 → 1:30 recover · ~154 W average" (L2-084 AC2). */
  readonly planSummary = computed(() => {
    const segments = this.loaded()?.plan.segments ?? [];
    return `${PlanSummary.structure(segments)} · ~${PlanSummary.averagePower(segments)} W average`;
  });

  constructor() {
    this.load();
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.player?.destroy();
    });
  }

  /** Try again: asks for the class once more. */
  retry(): void {
    this.load();
  }

  private load(): void {
    this.unavailable.set(false);
    this.classes
      .get(THE_CLASS_ID)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dto) => this.loaded.set(dto),
        error: () => this.unavailable.set(true),
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
