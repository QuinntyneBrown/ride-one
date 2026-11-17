// Adds X-Api-Key to /api requests and reports a 401 to the app (L2-035, L2-055). The app decides
// what a 401 means for the rider through UNAUTHORIZED_HANDLER; this library knows no route.
import { HttpContextToken, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiKeyStore } from './api-key.store';

export const SKIP_UNLOCK_REDIRECT = new HttpContextToken<boolean>(() => false);

/** Called after a 401 has cleared the key, unless the request set SKIP_UNLOCK_REDIRECT. */
export type UnauthorizedHandler = () => void;
export const UNAUTHORIZED_HANDLER = new InjectionToken<UnauthorizedHandler>('UNAUTHORIZED_HANDLER');

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const keys = inject(ApiKeyStore);
  const onUnauthorized = inject(UNAUTHORIZED_HANDLER, { optional: true });
  const key = keys.key();
  const request =
    key && !req.headers.has('X-Api-Key') ? req.clone({ setHeaders: { 'X-Api-Key': key } }) : req;
  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.context.get(SKIP_UNLOCK_REDIRECT)
      ) {
        keys.clear();
        onUnauthorized?.();
      }
      return throwError(() => error);
    }),
  );
};
