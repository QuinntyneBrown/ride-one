import type { Routes } from '@angular/router';
import { PROGRESS_API } from '@telo/api';
import { NewRiderProgress } from '@telo/domain';
import { provideClasses } from '../classes/provide-classes';
import { ClassLibraryStore } from './class-library-store';

/**
 * The Class Library's route, loaded with it: the catalogue client, the rider's progress and the library's store are
 * bound here, so their
 * code stays out of the other screens' chunks and the store goes when the rider leaves (AGENTS.md, lazy loading first).
 */
export const classLibraryRoutes: Routes = [
  {
    path: '',
    title: 'Classes · Telo Ride',
    providers: [
      provideClasses(),
      // The rider level, until the backend keeps progress (journey 10).
      { provide: PROGRESS_API, useClass: NewRiderProgress },
      ClassLibraryStore,
    ],
    loadComponent: () => import('./class-library-page'),
  },
];
