import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { type Observable, catchError, map, throwError } from 'rxjs';
import { AuthApiError, type AuthApiErrorCode } from './auth-api-error';
import type { AuthApi } from './auth-api';

const SIGN_IN_CODES: readonly AuthApiErrorCode[] = [
  'invalid_email',
  'rate_limited',
  'resend_too_soon',
];

/** Sign-in's HTTP client: `POST /api/auth/code` (ADR 0025). */
@Injectable()
export class HttpAuthApi implements AuthApi {
  private readonly http = inject(HttpClient);

  sendCode(email: string): Observable<void> {
    return this.http.post('/api/auth/code', { email }).pipe(
      map(() => undefined),
      catchError((failure: unknown) => throwError(() => refusal(failure))),
    );
  }
}

function refusal(failure: unknown): AuthApiError {
  if (!(failure instanceof HttpErrorResponse)) {
    return new AuthApiError('send_failed', null, 'The code could not be sent.');
  }
  const body: unknown = failure.error;
  const said =
    typeof body === 'object' && body !== null && 'code' in body ? String(body.code) : null;
  const code = SIGN_IN_CODES.find((known) => known === said) ?? 'send_failed';
  const retryAfter = Number(failure.headers.get('Retry-After'));
  return new AuthApiError(
    code,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
    `The code could not be sent (${failure.status}).`,
  );
}
