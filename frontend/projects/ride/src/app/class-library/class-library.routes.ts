import type { Routes } from '@angular/router';
import { PROGRESS_API } from '@telo/api';
import { NewRiderProgress } from '@telo/domain';
import { provideClasses } from '../classes/provide-classes';

/**
 * The Class Library's route, loaded with it: the catalogue client and the rider's progress are bound here, so their code
 * stays out of the other screens' chunks (AGENTS.md, lazy loading first). The page provides its own store, which goes
 * when the rider leaves.
 */
export const classLibraryRoutes: Routes = [
  {
    path: '',
    title: 'Classes · Telo Ride',
    providers: [
      provideClasses(),
      // The rider level, until the backend keeps progress (journey 10).
      { provide: PROGRESS_API, useClass: NewRiderProgress },
    ],
    loadComponent: () => import('./class-library-page'),
  },
];
