import { Routes } from '@angular/router';

/** Every route loads its component on demand (AGENTS.md, lazy loading first). */
export const routes: Routes = [
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
