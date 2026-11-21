import type { Routes } from '@angular/router';
import { PROGRESS_API } from '@telo/api';
import { NewRiderProgress } from '@telo/domain';
import { provideMaps } from '../maps/provide-maps';

/**
 * Race Setup's route, loaded with it: the map catalogue's client and the rider's progress are bound here, so their code
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
    loadComponent: () => import('./race-setup-page'),
  },
];
