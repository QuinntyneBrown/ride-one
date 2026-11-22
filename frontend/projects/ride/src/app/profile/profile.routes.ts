import type { Routes } from '@angular/router';
import { AUTH_API, HttpAuthApi } from '@telo/api';
import { AccountStore } from './account-store';

/**
 * Profile, loaded with it: the account's store and sign-in's client for signing out are bound here, out of every other
 * chunk (AGENTS.md, lazy loading first).
 */
export const profileRoutes: Routes = [
  {
    path: '',
    providers: [{ provide: AUTH_API, useClass: HttpAuthApi }, AccountStore],
    loadComponent: () => import('./profile-page'),
  },
];
