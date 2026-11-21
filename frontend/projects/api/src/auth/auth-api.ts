import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/**
 * Sign-in with an email code (docs/detailed-designs/accounts/sign-in-with-an-email-code). A refusal errors with an
 * `AuthApiError`.
 */
export interface AuthApi {
  /** Asks the backend to email a six-digit code to `email`; completes once it has been sent (202). */
  sendCode(email: string): Observable<void>;
}

export const AUTH_API = new InjectionToken<AuthApi>('AUTH_API');
