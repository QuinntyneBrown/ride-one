import { DestroyRef, Injectable, computed, inject } from '@angular/core';
import {
  BIKE_CONNECTION,
  type ClassDefinition,
  REMEMBERED_BIKE,
  THE_CLASS,
  type TheClassSource,
  VIDEO_PLAYER_FACTORY,
  type VideoPlayer,
} from '@telo/api';
import { PlanSummary, bikeStatus } from '@telo/domain';

/** The class, or `null` for one that is refused because it breaks a rule (L2-080 AC3). */
function read(source: TheClassSource): ClassDefinition | null {
  try {
    return source.get();
  } catch {
    return null;
  }
}

/**
 * Class Start's state, provided on its page: the one class, read from `THE_CLASS` (it ships with the app, ADR 0037),
 * what the page says of it, its video parked at the sync offset, and the bike's status for the header. A class that
 * breaks a rule is not offered: the store is `unavailable` (L2-080 AC3). It goes, with the player, when the rider
 * leaves.
 */
@Injectable()
export class ClassStartStore {
  private readonly loaded = read(inject(THE_CLASS));
  private readonly destroyRef = inject(DestroyRef);
  private readonly connection = inject(BIKE_CONNECTION);
  /** The bike this browser remembers names the status before the connection has one (L2-015). */
  private readonly remembered = inject(REMEMBERED_BIKE).get();
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private player: VideoPlayer | null = null;
  private videoHost: HTMLElement | null = null;
  private destroyed = false;

  /** The class, or `null` when it is not offered. */
  readonly definition = this.loaded;

  /** The class breaks a rule, so it is not offered. */
  readonly unavailable = this.loaded === null;

  /** The header's bike status (L2-019). */
  readonly bike = computed(() =>
    bikeStatus(this.connection.ble(), (this.connection.bike() ?? this.remembered)?.name ?? null),
  );

  /** "GCN Training · 20 min · Intervals", until slice 30.2 draws The Class (L2-084 AC1). */
  readonly meta = this.loaded
    ? `${this.loaded.channel} · ${Math.round(this.loaded.lengthSeconds / 60)} min · ${this.loaded.focus}`
    : '';

  /** "17 × 0:15 to 1:15 · 0:30 → 0:20 recover · ~254 W average", until slice 30.3 (L2-084 AC2). */
  readonly planSummary = this.loaded
    ? `${PlanSummary.structure(this.loaded.plan.segments)} · ~${PlanSummary.averagePower(this.loaded.plan.segments)} W average`
    : '';

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.player?.destroy();
    });
  }

  /**
   * Parks the class video in `host` at its sync offset with YouTube's controls, waiting for the rider (L2-084 AC1);
   * called once the frame is drawn.
   */
  parkVideo(host: HTMLElement): void {
    const dto = this.loaded;
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
