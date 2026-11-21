/** Why a code was not sent; a screen branches on it, the rider reads plain words (L2-001, L2-003). */
export type AuthApiErrorCode = 'invalid_email' | 'rate_limited' | 'resend_too_soon' | 'send_failed';

/** A refusal as the sign-in screens draw it: its code and, for 429, the seconds until the rider may try again. */
export interface SignInError {
  readonly code: AuthApiErrorCode;
  readonly retryAfterSeconds: number | null;
}

/**
 * A refusal from `AuthApi`: the backend's `code` when it is one of sign-in's, `send_failed` for anything else (no
 * network, a 500), and `Retry-After` in seconds for a 429.
 */
export class AuthApiError extends Error implements SignInError {
  constructor(
    readonly code: AuthApiErrorCode,
    readonly retryAfterSeconds: number | null,
    message: string,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}
