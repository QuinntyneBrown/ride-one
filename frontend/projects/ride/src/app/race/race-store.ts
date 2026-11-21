import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  BIKE_CONNECTION,
  GHOST_API,
  MAPS_API,
  type MapDto,
  type PackStrengthId,
  type RaceMode,
  SCREEN_WAKE_LOCK,
  TICKER,
} from '@telo/api';
import { type RaceBoardRow, type RaceDelta, type RaceGap, formatMetric } from '@telo/components';
import {
  BikeTelemetry,
  BotPack,
  GhostReplay,
  PowerModel,
  type RaceField,
  ResistanceController,
  RideClock,
  RideTicker,
  VirtualSpeedModel,
  type Standing,
  WorkoutEngine,
  formatGap,
  ordinal,
  rankStandings,
  routeProfile,
  routeProfileView,
} from '@telo/domain';
import { catchError, of, take } from 'rxjs';

/**
 * The race's state (docs/detailed-designs/race/ride-a-race), provided by the page so it goes when the rider leaves. It
 * reads the map of the address from `MAPS_API` and starts the race the moment it arrives: the clock, the ticker and the
 * engine following the map's plan, which sends each segment's level (L2-063 AC2). The screen stays awake while it runs
 * (L2-133 AC3). Its opponents (docs/detailed-designs/race/race-the-ghost-and-bots) are nine bots, or the ghost of the
 * rider's best in a solo race; each tick ranks them with the rider (L2-060, L2-059 AC1, AC4, AC5).
 */
@Injectable()
export class RaceStore {
  private readonly clock = inject(RideClock);
  private readonly ticker = inject(RideTicker);
  private readonly engine = inject(WorkoutEngine);
  private readonly connection = inject(BIKE_CONNECTION);
  private readonly telemetry = inject(BikeTelemetry);
  private readonly resistanceControl = inject(ResistanceController);
  private readonly wakeLock = inject(SCREEN_WAKE_LOCK);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute).snapshot;
  private readonly mapId = this.route.paramMap.get('mapId') ?? '';
  private readonly loaded = signal<MapDto | null>(null);
  private readonly ghosts = inject(GHOST_API);
  private readonly ridden = signal(0);
  private lastSecond = 0;
  private field: RaceField | null = null;
  /** The rider and the field by place, ranked once a second on the race's tick (L2-060 AC3). */
  private readonly standings = signal<readonly Standing[]>([]);
  private readonly beat = inject(TICKER);
  private readonly pausedByRider = signal(false);
  /** Whether the bike has reported the rider stopped since the pause, so the next stroke carries the race on. */
  private stoppedSincePause = false;

  /** Whom the race is against, and how hard the bots ride (`?mode=bots&pack=medium`, slice 7.2). */
  readonly mode: RaceMode =
    (['solo', 'bots', 'online'] as const).find(
      (mode) => mode === this.route.queryParamMap.get('mode'),
    ) ?? 'bots';
  private readonly pack: PackStrengthId =
    (['easy', 'medium', 'hard'] as const).find(
      (pack) => pack === this.route.queryParamMap.get('pack'),
    ) ?? 'medium';

  readonly map = this.loaded.asReadonly();
  /** Whether the rider paused the solo race: the clock, the distance and the standings hold (L2-068 AC1). */
  readonly paused = this.pausedByRider.asReadonly();
  /** Race Setup for the map, where Leave and End go (L2-069). */
  readonly setup: readonly string[] = ['/race', this.mapId];
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

  /** Power in whole watts, or "—" while it is unknown (L2-059 AC1). */
  readonly watts = computed(() => {
    const power = this.telemetry.powerW();
    return formatMetric(power === null ? null : Math.round(power), 0);
  });
  readonly target = computed(() => this.plan()?.targetPower ?? null);

  /** "-47 W" under the target, "+12 W" over it, or "On target" within 10 % (L2-059 AC1, AC2). */
  readonly delta = computed<RaceDelta | null>(() => {
    const power = this.telemetry.powerW();
    const target = this.target();
    if (power === null || target === null) return null;
    const watts = Math.round(power);
    if (PowerModel.onTarget(watts, target)) return { text: 'On target', tone: 'on' };
    const delta = watts - target;
    return delta > 0
      ? { text: `+${delta} W`, tone: 'over' }
      : { text: `-${-delta} W`, tone: 'under' };
  });

  readonly cadence = computed(() => formatMetric(this.telemetry.cadence(), 0));
  /** The bike's own heart rate; the strap joins with its slice (L2-030, L2-031). */
  readonly heart = computed(() => formatMetric(this.telemetry.heartRate(), 0));
  /** The virtual speed from power, `main`'s formula (L2-059 AC3). */
  readonly speed = computed(() => {
    const power = this.telemetry.powerW();
    return formatMetric(power === null ? null : VirtualSpeedModel.speedKmh(power), 1);
  });

  /** The map's route profile, `main`'s, built once from its plan and its world's terrain (L2-062). */
  private readonly profile = computed(() => {
    const map = this.loaded();
    return map ? routeProfile(map.terrain, map.plan.segments) : null;
  });

  /** What the route panel draws at the race clock's second. */
  readonly routeView = computed(() => {
    const map = this.loaded();
    const profile = this.profile();
    return map && profile ? routeProfileView(profile, map.plan.segments, this.elapsed()) : null;
  });

  /** Kilometres ridden at the virtual speed, two decimals ("1.62", L2-062 AC1). */
  readonly distance = computed(() => (this.ridden() / 1000).toFixed(2));

  /** The bike's reported resistance (L2-063 AC1), and whether Lower and Raise can reach it (L2-028 AC4). */
  readonly resistance = this.telemetry.resistance;
  readonly canControl = this.resistanceControl.canControl;

  /** "Standings · 10 riders", or "You vs your best" in a solo race (L2-060 AC1, AC4). */
  readonly boardHeading = computed(() =>
    this.mode === 'solo' ? 'You vs your best' : `Standings · ${this.standings().length} riders`,
  );

  readonly boardRows = computed<RaceBoardRow[]>(() =>
    this.standings().map((row) => ({
      id: row.id,
      place: row.place,
      name: row.name,
      jersey: row.jersey,
      bot: row.bot,
      you: row.you,
      gap: row.you ? '' : formatGap(row.gap),
    })),
  );

  private readonly you = computed(() => this.standings().find((row) => row.you) ?? null);

  /** "5th", or in a solo race "Ahead" or "Behind" the ghost, level counting as ahead (L2-059 AC1, AC4). */
  readonly place = computed(() => {
    const you = this.you();
    if (!you) return '';
    if (this.mode === 'solo') return you.place === 1 ? 'Ahead' : 'Behind';
    return ordinal(you.place);
  });

  /** The field's size beside the place; none in a solo race. */
  readonly fieldSize = computed(() => (this.mode === 'solo' ? null : this.standings().length));

  /** The gaps to the riders either side ("Ahead +0:02", "Behind −0:01"), or the ghost's ("Best +0:01"). */
  readonly gaps = computed<RaceGap[]>(() => {
    const rows = this.standings();
    const you = this.you();
    if (!you) return [];
    if (this.mode === 'solo') {
      const ghost = rows.find((row) => !row.you);
      return ghost ? [{ label: 'Best', value: formatGap(ghost.gap) }] : [];
    }
    const ahead = rows[you.place - 2];
    const behind = rows[you.place];
    return [
      ...(ahead ? [{ label: 'Ahead', value: formatGap(ahead.gap) }] : []),
      ...(behind ? [{ label: 'Behind', value: formatGap(behind.gap) }] : []),
    ];
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
    this.destroyRef.onDestroy(() => this.wakeLock.release());
  }

  private start(map: MapDto): void {
    this.loaded.set(map);
    this.wakeLock.hold();
    this.clock.start();
    this.ticker.start();
    this.engine.follow(map.plan);
    this.startField(map);
    this.ticker.ticks
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((second) => this.ride(second));
    // The pedals are watched on a beat of their own: the race clock's ticks stop while the race is held.
    this.beat.seconds.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.watchPedals());
  }

  /** Holds a solo race where it is; a bots or riders-online race has no Pause (L2-068 AC1, AC3). */
  pause(): void {
    if (this.mode !== 'solo' || this.pausedByRider()) return;
    this.pausedByRider.set(true);
    this.stoppedSincePause = false;
    this.clock.pause();
  }

  /** Carries the race on from where it stopped (L2-068 AC2). */
  resume(): void {
    if (!this.pausedByRider()) return;
    this.pausedByRider.set(false);
    this.clock.resume();
  }

  /**
   * Pedalling carries a paused race on, checked once a second: once the bike has reported the rider stopped (cadence 0
   * or none) since the pause, the next cadence above 0 resumes it, so the stroke under the rider's press does not.
   */
  private watchPedals(): void {
    if (!this.pausedByRider()) return;
    const cadence = this.telemetry.cadence();
    if (cadence === null || cadence === 0) this.stoppedSincePause = true;
    else if (this.stoppedSincePause) this.resume();
  }

  /**
   * The race's opponents: nine bots paced by the pack, or in a solo race the ghost of the rider's best on the map, the
   * medium pace when there is none or it cannot be read (L2-067 AC1, AC2; L2-050 AC4). Riders online have their own
   * field with journey 15.
   */
  private startField(map: MapDto): void {
    if (this.mode === 'bots') {
      this.field = new BotPack(map.id, this.pack);
      this.rank();
    } else if (this.mode === 'solo') {
      this.ghosts
        .bestRide(map.id)
        .pipe(
          take(1),
          catchError(() => of(null)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((trace) => {
          this.field = new GhostReplay(trace);
          this.rank();
        });
    }
  }

  /** Ranks the rider and the field at the last second ridden, the gaps at the rider's speed of the moment. */
  private rank(): void {
    if (!this.field) return;
    const power = this.telemetry.powerW();
    const speed = power === null || power <= 0 ? null : VirtualSpeedModel.speedMs(power);
    this.standings.set(rankStandings(this.field.advance(this.lastSecond), this.ridden(), speed));
  }

  /** Raise and Lower send the next level as the rider's own (L2-028 AC1). */
  raise(): void {
    void this.resistanceControl.nudge(1);
  }

  lower(): void {
    void this.resistanceControl.nudge(-1);
  }

  /**
   * Each second of the clock the rider covers the virtual speed of their power; seconds a hidden tab skipped count at
   * the power of the moment. Without power, stopped, the rider rides no further.
   */
  private ride(second: number): void {
    const power = this.telemetry.powerW();
    const seconds = second - this.lastSecond;
    this.lastSecond = second;
    if (power !== null && power > 0 && seconds > 0)
      this.ridden.update((metres) => metres + VirtualSpeedModel.speedMs(power) * seconds);
    this.rank();
  }
}
