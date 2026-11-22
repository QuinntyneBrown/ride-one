import { inject } from '@angular/core';
import { Router, type Routes } from '@angular/router';
import { AUTH_API, HttpAuthApi } from '@telo/api';
import { SignInStore } from './sign-in-store';

/**
 * Sign-in's routes, loaded with them: sign-in's client and its store are bound here, shared by the email and the code
 * screens and out of every other chunk (AGENTS.md, lazy loading first). The code screen opens only once a code was sent.
 */
export const signInRoutes: Routes = [
  {
    path: '',
    providers: [{ provide: AUTH_API, useClass: HttpAuthApi }, SignInStore],
    children: [
      {
        path: '',
        title: 'Sign in · Telo Ride',
        loadComponent: () => import('./sign-in-page'),
      },
      {
        path: 'code',
        title: 'Check your email · Telo Ride',
        canActivate: [
          () => inject(SignInStore).sentTo() !== null || inject(Router).createUrlTree(['/sign-in']),
        ],
        loadComponent: () => import('./sign-in-code-page'),
      },
    ],
  },
];
