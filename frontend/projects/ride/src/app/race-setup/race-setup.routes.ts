import type { Routes } from '@angular/router';
import { PROGRESS_API } from '@telo/api';
import { NewRiderProgress } from '@telo/domain';
import { provideMaps } from '../maps/provide-maps';
import { openMapGuard } from '../maps/open-map.guard';

/**
 * Race Setup's route, loaded with it, opened only for a map open to the rider: the map catalogue's client and the rider's progress are bound here, so their code
 * stays out of the other screens' chunks (AGENTS.md, lazy loading first). The page provides its own store, which goes
 * when the rider leaves.
 */
export const raceSetupRoutes: Routes = [
  {
    path: '',
    title: 'Race Setup · Telo Ride',
    providers: [
      provideMaps(),
      // The rider's maps and level, until the backend keeps progress (journey 10).
      { provide: PROGRESS_API, useClass: NewRiderProgress },
    ],
    canActivate: [openMapGuard],
    loadComponent: () => import('./race-setup-page'),
  },
];
