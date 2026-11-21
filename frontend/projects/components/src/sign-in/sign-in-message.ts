import type { SignInError } from '@telo/api';

/**
 * The words the sign-in screens show for a refusal (L2-001 AC5, L2-003 AC4), or null when the refusal has its own place:
 * an invalid address is marked under its field, and a code sent moments ago shows as the countdown.
 */
export function signInMessage(error: SignInError | null): string | null {
  switch (error?.code) {
    case 'send_failed':
      return 'We couldn’t send your code. Check your connection and try again.';
    case 'rate_limited': {
      const minutes = Math.max(1, Math.ceil((error.retryAfterSeconds ?? 3600) / 60));
      return `Too many codes asked for. Try again in ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}.`;
    }
    default:
      return null;
  }
}
