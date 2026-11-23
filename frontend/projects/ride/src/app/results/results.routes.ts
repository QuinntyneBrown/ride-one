import type { Routes } from '@angular/router';

/** Results, for a finished class (Telo Ride 1 has no races). */
export const resultsRoutes: Routes = [
  {
    path: '',
    title: 'Results · Telo Ride',
    loadComponent: () => import('./results-page'),
  },
];
