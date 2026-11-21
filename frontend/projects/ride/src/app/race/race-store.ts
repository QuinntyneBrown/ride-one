import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { BIKE_CONNECTION, MAPS_API, type MapDto, type RaceMode, SCREEN_WAKE_LOCK } from '@telo/api';
import { RideClock, RideTicker, WorkoutEngine } from '@telo/domain';

/**
 * The race's state (docs/detailed-designs/race/ride-a-race), provided by the page so it goes when the rider leaves. It
 * reads the map of the address from `MAPS_API` and starts the race the moment it arrives: the clock, the ticker and the
 * engine following the map's plan, which sends each segment's level (L2-063 AC2). The screen stays awake while it runs
 * (L2-133 AC3).
 */
@Injectable()
export class RaceStore {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly engine = inject(WorkoutEngine);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  private readonly route = inject(ActivatedRoute).snapshot;
  private readonly mapId = this.route.paramMap.get('mapId') ?? '';
  private readonly loaded = signal<MapDto | null>(null);

  /** Whom the race is against, and how hard the bots ride (`?mode=bots&pack=medium`, slice 7.2). */
  readonly mode: RaceMode =
    (['solo', 'bots', 'online'] as const).find(
      (mode) => mode === this.route.queryParamMap.get('mode'),
    ) ?? 'bots';
  private readonly pack = this.route.queryParamMap.get('pack') ?? 'medium';

  readonly map = this.loaded.asReadonly();
  readonly elapsed = this.ticker.second;
  readonly plan = this.engine.state;

  /** The plan's length in seconds. */
  readonly total = computed(
    () => this.loaded()?.plan.segments.reduce((sum, segment) => sum + segment.duration, 0) ?? 0,
  );

  /** "Cathedral Circuit · vs Bots, medium", "· vs your best" or "· Live race" (L2-058 AC1, AC2). */
  readonly routeLine = computed(() => {
    const against =
      this.mode === 'solo'
        ? 'vs your best'
        : this.mode === 'online'
          ? 'Live race'
          : `vs Bots, ${this.pack}`;
    return [this.loaded()?.routeName, against].filter(Boolean).join(' · ');
  });

  /** The scene's description, one image (L2-064 AC4): "The Old Town Criterium world: a cobbled …". */
  readonly sceneLabel = computed(() => {
    const map = this.loaded();
    return map
      ? `The ${map.name} world: ${map.place.charAt(0).toLowerCase()}${map.place.slice(1)}`
      : '';
  });

  readonly bikeName = computed(() => this.connection.bike()?.name ?? null);
  readonly connected = computed(() => this.connection.ble() === 'connected');

  constructor() {
    inject(MAPS_API)
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe((maps) => {
        const map = maps.find((each) => each.id === this.mapId);
        if (map) this.start(map);
      });
    // The lock is bound on the route, whose injector outlives the page.
    inject(DestroyRef).onDestroy(() => this.wakeLock.release());
  }

  private start(map: MapDto): void {
    this.loaded.set(map);
    this.wakeLock.hold();
    this.clock.start();
    this.ticker.start();
    this.engine.follow(map.plan);
  }
}
