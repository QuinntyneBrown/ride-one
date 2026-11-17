// Adds X-Api-Key to /api requests and, on a 401, forgets the key and hands over to the app
// (L2-035, L2-055). The app decides where a 401 leads; this library knows no route (ADR 0013).
import { HttpContextToken, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { InjectionToken, inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ApiKeyStore } from './api-key.store';

export const SKIP_UNLOCK_REDIRECT = new HttpContextToken<boolean>(() => false);

/** What the app does once a request was refused for a missing or wrong key. */
export const UNAUTHORIZED_HANDLER = new InjectionToken<() => void>('UNAUTHORIZED_HANDLER', {
  providedIn: 'root',
  factory: () => () => undefined,
});

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const keys = inject(ApiKeyStore);
  const unauthorized = inject(UNAUTHORIZED_HANDLER);
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
        unauthorized();
      }
      return throwError(() => error);
    }),
  );
};
