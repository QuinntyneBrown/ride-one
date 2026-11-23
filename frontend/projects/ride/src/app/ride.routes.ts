import { provideHttpClient, withFetch } from '@angular/common/http';
import { inject, provideEnvironmentInitializer } from '@angular/core';
import type { Routes } from '@angular/router';
import { ANNOUNCER, DISPLAY_PREFERENCES, FULLSCREEN } from '@telo/api';
import { BrowserDisplayPreferences, BrowserFullscreen, LiveRegionAnnouncer } from '@telo/domain';
import { provideAppCache } from './app-cache/provide-app-cache';
import { provideAppUpdates } from './app-update/provide-app-updates';
import { provideBikeConnection } from './bike/provide-bike-connection';
import { rememberedBikeGuard } from './bike/remembered-bike.guard';

/**
 * The four screens and page not found (ADR 0040), under one parent that provides the bike connection: one instance shared from Connect Bike to the ride,
 * loaded with the first screen instead of with the initial bundle (AGENTS.md, lazy loading first).
 */
export const rideRoutes: Routes = [
  {
    path: '',
    providers: [
      provideBikeConnection(),
      // The one `HttpClient` the screens share, for the class catalogue. Telo Ride 1 has no account (ADR 0039).
      provideHttpClient(withFetch()),
      provideAppCache(),
      // Each new version offered between rides, never during one (L2-150 AC2).
      provideAppUpdates(),
      // The theme and reduced motion this device asks for, on <html> from the start (L2-143, L2-142).
      { provide: DISPLAY_PREFERENCES, useClass: BrowserDisplayPreferences },
      provideEnvironmentInitializer(() => void inject(DISPLAY_PREFERENCES)),
      // Full screen, which every header offers (L2-144).
      { provide: FULLSCREEN, useClass: BrowserFullscreen },
      // What a screen reader hears: a ride's steps and the result (L2-141 AC2).
      { provide: ANNOUNCER, useClass: LiveRegionAnnouncer },
    ],
    children: [
      // Connect Bike, where a new rider starts (docs/mocks/pages/connect-bike/).
      {
        path: 'connect',
        title: 'Connect your bike · Telo Ride 1',
        loadComponent: () => import('./connect/connect-bike-page'),
      },
      // The class ride, at its present address until slice 31.1 moves it to `/ride` (docs/mocks/pages/class-ride/).
      {
        path: 'classes/:id/ride',
        canActivate: [rememberedBikeGuard],
        loadChildren: () => import('./class-ride/class-ride.routes').then((m) => m.classRideRoutes),
      },
      // Results, until Class Done replaces it (slice 32.2).
      {
        path: 'results',
        loadChildren: () => import('./results/results.routes').then((m) => m.resultsRoutes),
      },
      // `/` is the class: Class Start for the one class, until slice 30.2 draws The Class (ADR 0040).
      {
        path: '',
        pathMatch: 'full',
        canActivate: [rememberedBikeGuard],
        loadChildren: () =>
          import('./class-start/class-start.routes').then((m) => m.classStartRoutes),
      },
      // An address that matches no screen (L2-145). Always last.
      {
        path: '**',
        title: 'Page not found · Telo Ride 1',
        loadComponent: () => import('./not-found/not-found-page'),
      },
    ],
  },
];
