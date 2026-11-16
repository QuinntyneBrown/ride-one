import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Ride · Wattzup',
    loadComponent: () => import('./dashboard/ride-page/ride-page').then((m) => m.RidePage),
  },
  {
    path: 'setup',
    title: 'Set up your ride · Wattzup',
    loadComponent: () => import('./dashboard/setup-page/setup-page').then((m) => m.SetupPage),
  },
];
