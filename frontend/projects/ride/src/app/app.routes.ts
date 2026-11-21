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
    ],
  },
];
