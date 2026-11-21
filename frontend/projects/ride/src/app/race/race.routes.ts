import type { Routes } from '@angular/router';
import { MONOTONIC_TIME, PROGRESS_API, SCREEN_WAKE_LOCK } from '@telo/api';
import { BrowserScreenWakeLock, NewRiderProgress } from '@telo/domain';
import { openMapGuard } from '../maps/open-map.guard';
import { provideMaps } from '../maps/provide-maps';

/**
 * The race's route, loaded with it and opened only for a map open to the rider: the map catalogue's client and the
 * rider's progress (the device's copy when the backend cannot be reached),
 * the monotonic clock the race runs on (`performance.now()`, L2-133 AC1) and the screen wake lock (AC3), so their code
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
      { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
      { provide: SCREEN_WAKE_LOCK, useClass: BrowserScreenWakeLock },
    ],
    canActivate: [openMapGuard],
    loadComponent: () => import('./race-page'),
  },
];
