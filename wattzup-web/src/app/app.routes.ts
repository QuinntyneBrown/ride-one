import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Ride · Wattzup',
    loadComponent: () => import('./dashboard/ride-page/ride-page').then((m) => m.RidePage),
  },
];
