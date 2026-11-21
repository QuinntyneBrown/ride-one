import type { Routes } from '@angular/router';

/** Every route loads its component on demand (AGENTS.md, lazy loading first). */
export const routes: Routes = [
  // Connect Bike stands alone, with no app navigation (docs/mocks/pages/connect-bike/).
  {
    path: 'connect',
    title: 'Connect your bike · Telo Ride',
    loadComponent: () => import('./connect/connect-bike-page'),
  },
  {
    path: '',
    loadComponent: () => import('./main-shell/main-shell'),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Telo Ride',
        loadComponent: () => import('./home/home-page'),
      },
      // An address that matches no screen (L2-145). Always last.
      {
        path: '**',
        title: 'Page not found · Telo Ride',
        loadComponent: () => import('./not-found/not-found-page'),
      },
    ],
  },
];
