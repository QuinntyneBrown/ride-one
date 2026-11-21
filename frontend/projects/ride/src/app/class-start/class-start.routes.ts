import type { Routes } from '@angular/router';
import { provideClasses } from '../classes/provide-classes';

/**
 * Class Start's route, loaded with it: the catalogue client is bound here, so its code stays out of the other screens'
 * chunks (AGENTS.md, lazy loading first). The page provides its own store, which goes when the rider leaves.
 */
export const classStartRoutes: Routes = [
  {
    path: '',
    title: 'Class Start · Telo Ride',
    providers: [provideClasses()],
    loadComponent: () => import('./class-start-page'),
  },
];
