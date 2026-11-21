import { Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAPS_API, type MapDto, type MapProgressDto, PROGRESS_API } from '@telo/api';

/** Where a map stands on the rider's unlock path. */
export type MapRowState = 'open' | 'next' | 'locked';

/** One row of the path: the map, its state, its stars and best, and its goal while locked. */
export interface MapPathRow {
  readonly map: MapDto;
  readonly state: MapRowState;
  readonly stars: number;
  readonly bestSeconds: number | null;
}

/**
 * Map Select's state, provided on its page (docs/detailed-designs/race/browse-maps): the catalogue joined with the
 * rider's map progress, one row per map in unlock order. It goes when the rider leaves.
 */
@Injectable()
export class MapPathStore {
  private readonly catalogue = signal<readonly MapDto[] | null>(null);
  private readonly progress = signal<MapProgressDto | null>(null);

  readonly rows = computed<readonly MapPathRow[]>(() => {
    const maps = this.catalogue();
    const progress = this.progress();
    if (!maps || !progress) return [];
    return maps.map((map) => ({
      map,
      state: progress.openMapIds.includes(map.id)
        ? 'open'
        : progress.nextUnlockId === map.id
          ? 'next'
          : 'locked',
      stars: progress.stars[map.id] ?? 0,
      bestSeconds: progress.bestTimeSeconds[map.id] ?? null,
    }));
  });

  constructor() {
    inject(MAPS_API)
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe((maps) => this.catalogue.set(maps));
    inject(PROGRESS_API)
      .maps()
      .pipe(takeUntilDestroyed())
      .subscribe((progress) => this.progress.set(progress));
  }
}
