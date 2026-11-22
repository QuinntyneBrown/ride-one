import type { Routes } from '@angular/router';
import {
  GHOST_API,
  MAPS_KEY,
  MONOTONIC_TIME,
  PROGRESS_API,
  SCREEN_WAKE_LOCK,
  WORLD_RENDERER,
} from '@telo/api';
import { BrowserScreenWakeLock, MapsKeyStore, NewRiderProgress, NoBestRides } from '@telo/domain';
import { openMapGuard } from '../maps/open-map.guard';
import { provideMaps } from '../maps/provide-maps';

/**
 * The race's route, loaded with it and opened only for a map open to the rider: the map catalogue's client and the
 * rider's progress (the device's copy when the backend cannot be reached), the finished rides' client,
 * the monotonic clock the race runs on (`performance.now()`, L2-133 AC1), the screen wake lock (AC3) and the world's
 * renderer loader, so their code
 * stays out of the other screens' chunks (AGENTS.md, lazy loading first). The page provides the race itself, which
 * goes when the rider leaves.
 */
export const raceRoutes: Routes = [
  {
    path: '',
    title: 'Race · Telo Ride',
    providers: [
      provideMaps(),
      // The rider's maps and level, until the backend keeps progress (journey 10).
      { provide: PROGRESS_API, useClass: NewRiderProgress },
      // No ride has a best until rides are recorded (10.1) and a best's trace kept (11.2).
      { provide: GHOST_API, useClass: NoBestRides },
      { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
      { provide: SCREEN_WAKE_LOCK, useClass: BrowserScreenWakeLock },
      // The rider's Google Maps Platform key, on this device only (L2-066 AC3).
      { provide: MAPS_KEY, useClass: MapsKeyStore },
      // The world's renderer, imported with the world library and Three.js only when the race draws its world (ADR 0030).
      {
        provide: WORLD_RENDERER,
        useValue: () => import('@telo/world').then((world) => world.loadWorldRenderer()),
      },
    ],
    canActivate: [openMapGuard],
    loadComponent: () => import('./race-page'),
  },
];
