import type { Routes } from '@angular/router';

/** Class Done, for a finished class (L2-078): at `/done`, opened by a ride's finish. */
export const classDoneRoutes: Routes = [
  {
    path: '',
    title: 'Class Done · Telo Ride 1',
    loadComponent: () => import('./class-done-page'),
  },
];
