import type { Routes } from '@angular/router';
import { provideBikeConnection } from './bike/provide-bike-connection';
import { rememberedBikeGuard } from './bike/remembered-bike.guard';

/**
 * Every screen, under one parent that provides the bike connection: one instance shared from Connect Bike to the ride,
 * loaded with the first screen instead of with the initial bundle (AGENTS.md, lazy loading first).
 */
export const rideRoutes: Routes = [
  {
    path: '',
    providers: [provideBikeConnection()],
    children: [
      // Connect Bike stands alone, with no app navigation (docs/mocks/pages/connect-bike/).
      {
        path: 'connect',
        title: 'Connect your bike · Telo Ride',
        loadComponent: () => import('./connect/connect-bike-page'),
      },
      // A class ride has its own header, with no app navigation (docs/mocks/pages/class-ride/).
      {
        path: 'classes/:id/ride',
        canActivate: [rememberedBikeGuard],
        loadChildren: () => import('./class-ride/class-ride.routes').then((m) => m.classRideRoutes),
      },
      {
        path: '',
        loadComponent: () => import('./main-shell/main-shell'),
        children: [
          {
            path: '',
            pathMatch: 'full',
            title: 'Telo Ride',
            canActivate: [rememberedBikeGuard],
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
    ],
  },
];
