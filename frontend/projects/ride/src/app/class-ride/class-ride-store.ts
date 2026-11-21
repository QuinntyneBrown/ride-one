import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CLASSES_API, type ClassDto, VIDEO_PLAYER_FACTORY, type VideoPlayer } from '@telo/api';
import { type ClassStatTone, formatMetric } from '@telo/components';
import {
  BikeTelemetry,
  PowerModel,
  ResistanceController,
  RideClock,
  RideTicker,
  WorkoutEngine,
} from '@telo/domain';

/** A live stat as the bike panel shows it. */
export interface StatView {
  readonly value: string;
  readonly hint: string | null;
  readonly tone: ClassStatTone | null;
}

/**
 * The solo class ride's state (docs/detailed-designs/classes/ride-a-class), provided by the page so it goes when the
 * rider leaves. It loads the class from `CLASSES_API` and starts the ride the moment it arrives: the clock, the ticker
 * and the engine following the plan, which sends each segment's level (L2-027). The header and the segment card read
 * the ticker's whole seconds (L2-134 AC2); Power and Cadence read the bike's telemetry as it arrives (AC1). The class
 * video plays from the ride clock plus the class's sync offset (L2-088 AC1); when it cannot play, the ride carries on
 * without it (AC4).
 */
@Injectable()
export class ClassRideStore {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly engine = inject(WorkoutEngine);
  private readonly resistance = inject(ResistanceController);
  private readonly telemetry = inject(BikeTelemetry);
  private readonly loaded = signal<ClassDto | null>(null);
  private readonly playerFactory = inject(VIDEO_PLAYER_FACTORY);
  private readonly player = signal<VideoPlayer | null>(null);
  private readonly playerMissing = signal(false);
  private videoHost: HTMLElement | null = null;
  private destroyed = false;

  readonly ride = this.loaded.asReadonly();
  readonly elapsed = this.ticker.second;
  readonly plan = this.engine.state;
  readonly level = this.telemetry.resistance;
  readonly canControl = this.resistance.canControl;
  /** Whether the video cannot play: its code or YouTube's did not load, or the player failed. */
  readonly videoUnavailable = computed(
    () => this.playerMissing() || this.player()?.state() === 'error',
  );

  /** Power against the segment's target: "On target" within 10 %, otherwise the signed delta (L2-089 AC2). */
  readonly power = computed<StatView>(() => {
    const power = this.telemetry.powerW();
    const target = this.plan()?.targetPower ?? null;
    if (power === null || target === null) {
      return {
        value: formatMetric(power, 0),
        hint: target === null ? null : `Target ${target} W`,
        tone: null,
      };
    }
    const watts = Math.round(power);
    if (PowerModel.onTarget(watts, target))
      return { value: String(watts), hint: 'On target', tone: 'on' };
    const delta = watts - target;
    return {
      value: String(watts),
      hint: `${delta > 0 ? '+' : '-'}${Math.abs(delta)} W`,
      tone: delta > 0 ? 'over' : 'under',
    };
  });

  /** Cadence with the segment's aim (L2-089 AC3). */
  readonly cadence = computed<StatView>(() => {
    const aim = this.plan()?.segment.cadenceAim;
    return {
      value: formatMetric(this.telemetry.cadence(), 0),
      hint: aim === undefined ? null : `Aim ${aim}`,
      tone: null,
    };
  });

  constructor() {
    const id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
    inject(CLASSES_API)
      .get(id)
      .pipe(takeUntilDestroyed())
      .subscribe((dto) => this.start(dto));
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.player()?.destroy();
    });
  }

  /** Plays the class video in `host`, the frame the page renders once the class has arrived; called once. */
  playVideo(host: HTMLElement): void {
    const ride = this.loaded();
    if (!ride || this.videoHost) return;
    this.videoHost = host;
    this.playerFactory().then(
      (player) => {
        if (this.destroyed) return player.destroy();
        this.player.set(player);
        void player.load(host, ride.video.videoId, {
          startSeconds: ride.video.syncOffsetSeconds + this.clock.elapsedMs() / 1000,
          controls: false,
          title: ride.title,
        });
      },
      () => this.playerMissing.set(true),
    );
  }

  raise(): void {
    void this.resistance.nudge(1);
  }

  lower(): void {
    void this.resistance.nudge(-1);
  }

  private start(dto: ClassDto): void {
    this.loaded.set(dto);
    this.clock.start();
    this.ticker.start();
    this.engine.follow(dto.plan);
  }
}
