import type { Routes } from '@angular/router';
import { provideClasses } from '../classes/provide-classes';
import { ClassLibraryStore } from './class-library-store';

/**
 * The Class Library's route, loaded with it: the catalogue client and the library's store are bound here, so their
 * code stays out of the other screens' chunks and the store goes when the rider leaves (AGENTS.md, lazy loading first).
 */
export const classLibraryRoutes: Routes = [
  {
    path: '',
    title: 'Classes · Telo Ride',
    providers: [provideClasses(), ClassLibraryStore],
    loadComponent: () => import('./class-library-page'),
  },
];
