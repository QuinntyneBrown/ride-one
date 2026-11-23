import { inject, provideEnvironmentInitializer } from '@angular/core';
import type { Routes } from '@angular/router';
import { ANNOUNCER, DISPLAY_PREFERENCES, FINISHED_RIDES, FULLSCREEN } from '@telo/api';
import {
  BrowserDisplayPreferences,
  BrowserFullscreen,
  LiveRegionAnnouncer,
  NoFinishedRides,
} from '@telo/domain';
import { provideAppCache } from './app-cache/provide-app-cache';
import { provideAppUpdates } from './app-update/provide-app-updates';
import { provideBikeConnection } from './bike/provide-bike-connection';
import { rememberedBikeGuard } from './bike/remembered-bike.guard';
import { THE_CLASS_ID } from './classes/the-class';

/**
 * The four screens and page not found (ADR 0040), under one parent that provides the bike connection: one instance shared from Connect Bike to the ride,
 * loaded with the first screen instead of with the initial bundle (AGENTS.md, lazy loading first).
 */
export const rideRoutes: Routes = [
  {
    path: '',
    providers: [
      provideBikeConnection(),
      // Whether the rider has finished a ride, which the app opens by (L2-167): never, until the record of slice 32.1.
      { provide: FINISHED_RIDES, useClass: NoFinishedRides },
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
      // The address names the one class; no other class has one (L2-080 AC4).
      {
        path: `classes/${THE_CLASS_ID}/ride`,
        canActivate: [rememberedBikeGuard],
        loadChildren: () => import('./class-ride/class-ride.routes').then((m) => m.classRideRoutes),
      },
      // Results, until Class Done replaces it (slice 32.2).
      {
        path: 'results',
        loadChildren: () => import('./results/results.routes').then((m) => m.resultsRoutes),
      },
      // `/` is The Class, the home screen (docs/mocks/pages/the-class/); a new rider is sent on to Connect Bike (L2-167).
      {
        path: '',
        pathMatch: 'full',
        canActivate: [rememberedBikeGuard],
        loadChildren: () => import('./the-class/the-class.routes').then((m) => m.theClassRoutes),
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
