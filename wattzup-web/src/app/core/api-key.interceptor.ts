// Adds X-Api-Key to /api requests and turns a 401 into the unlock page (L2-035, L2-055).
import { HttpContextToken, HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ApiKeyStore } from './api-key.store';

export const SKIP_UNLOCK_REDIRECT = new HttpContextToken<boolean>(() => false);

export const apiKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const keys = inject(ApiKeyStore);
  const router = inject(Router);
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
        const current = router.currentNavigation();
        const returnUrl = current
          ? router.serializeUrl(current.finalUrl ?? current.extractedUrl)
          : router.url;
        if (!returnUrl.startsWith('/unlock')) {
          void router.navigate(['/unlock'], { queryParams: { returnUrl } });
        }
      }
      return throwError(() => error);
    }),
  );
};
