import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { MAPS_API, type MapDto, type MapProgressDto, PROGRESS_API } from '@telo/api';
import type { ModeOption, PackStrengthId } from '@telo/components';

/**
 * Race Setup's state, provided on its page (docs/detailed-designs/race/set-up-a-race): the map of the address, read
 * from `MAPS_API` (the device's copy when the backend cannot be reached), and the rider's progress on it. It goes, with
 * its requests, when the rider leaves.
 */
@Injectable()
export class RaceSetupStore {
  private readonly mapId = inject(ActivatedRoute).snapshot.paramMap.get('mapId') ?? '';
  private readonly catalogue = signal<readonly MapDto[]>([]);
  private readonly progress = signal<MapProgressDto | null>(null);
  private readonly level = signal(1);

  /** The map, once the catalogue has arrived. */
  readonly map = computed(() => this.catalogue().find((map) => map.id === this.mapId) ?? null);

  /** "Cathedral Circuit · A cobbled European old town on race day" (L2-047 AC1). */
  readonly routeLine = computed(() => {
    const map = this.map();
    return map ? [map.routeName, map.place].filter(Boolean).join(' · ') : '';
  });

  /** The stars earned here, and the best time, or none (L2-047 AC2, AC4). */
  readonly earned = computed(() => this.progress()?.stars[this.mapId] ?? 0);
  readonly bestSeconds = computed(() => this.progress()?.bestTimeSeconds[this.mapId] ?? null);

  /** The rider's next unlock when its goal is earned on this map, or none (L2-047 AC3). */
  readonly goal = computed(() => {
    const next = this.catalogue().find((map) => map.id === this.progress()?.nextUnlockId);
    return next?.unlockGoal && next.unlockMapId === this.mapId
      ? { goal: next.unlockGoal, opens: next.name }
      : null;
  });

  /**
   * Whom to race (L2-048 AC1): your best time, bots, and riders online, which opens at rider level 3 (AC2). Its queue
   * count and seat come with live races (journey 15); until then a rider at level 3 is told it can't be reached.
   */
  readonly modes = computed<readonly ModeOption[]>(() => [
    {
      id: 'solo',
      title: 'Your best time',
      body: 'Solo. A ghost of your fastest ride sets the pace.',
      icon: 'ghost',
      disabled: false,
    },
    {
      id: 'bots',
      title: 'Bots',
      body: "9 computer riders. Starts the moment you're ready.",
      icon: 'bots',
      disabled: false,
    },
    {
      id: 'online',
      title: 'Riders online',
      body: this.level() < 3 ? 'Opens at level 3.' : 'Riders online can’t be reached right now.',
      icon: 'riders',
      disabled: true,
    },
  ]);

  /** The chosen mode, Bots by default (L2-048 AC1). */
  readonly mode = signal('bots');

  /** How hard the bots ride, medium by default (L2-049 AC1). */
  readonly pack = signal<PackStrengthId>('medium');

  constructor() {
    inject(MAPS_API)
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (maps) => this.catalogue.set(maps), error: () => this.catalogue.set([]) });
    inject(PROGRESS_API)
      .maps()
      .pipe(takeUntilDestroyed())
      .subscribe((progress) => this.progress.set(progress));
    inject(PROGRESS_API)
      .level()
      .pipe(takeUntilDestroyed())
      .subscribe((level) => this.level.set(level));
  }
}
