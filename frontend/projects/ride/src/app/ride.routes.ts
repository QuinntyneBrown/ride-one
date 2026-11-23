import { inject, provideEnvironmentInitializer } from '@angular/core';
import type { Routes } from '@angular/router';
import { ANNOUNCER, DISPLAY_PREFERENCES, FINISHED_RIDES, FULLSCREEN, RIDE_RECORD } from '@telo/api';
import {
  BrowserDisplayPreferences,
  BrowserFullscreen,
  LiveRegionAnnouncer,
  RideRecordStore,
} from '@telo/domain';
import { provideAppCache } from './app-cache/provide-app-cache';
import { provideAppUpdates } from './app-update/provide-app-updates';
import { connectedBikeGuard } from './bike/connected-bike.guard';
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
      // The record of finished rides, kept on the device (L2-168), which also says whether the rider has finished one:
      // the app opens by it (L2-167).
      { provide: RIDE_RECORD, useClass: RideRecordStore },
      { provide: FINISHED_RIDES, useExisting: RIDE_RECORD },
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
      // Class Ride (docs/mocks/pages/class-ride/, L2-087). The start button on The Class opens it; opened without a
      // connected bike, in a blocked browser too, the address opens `/` instead and nothing is asked of the bike
      // (AC4, L2-010 AC2). No class has an address of its own (L2-080 AC4).
      {
        path: 'ride',
        canActivate: [connectedBikeGuard],
        loadChildren: () => import('./class-ride/class-ride.routes').then((m) => m.classRideRoutes),
      },
      // Class Done, for a finished class (L2-078).
      {
        path: 'done',
        loadChildren: () => import('./class-done/class-done.routes').then((m) => m.classDoneRoutes),
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
