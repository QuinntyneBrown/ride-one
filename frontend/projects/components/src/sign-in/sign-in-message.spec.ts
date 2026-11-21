import { signInMessage } from './sign-in-message';

describe('signInMessage (L2-001 AC5, L2-003 AC4)', () => {
  it('says a failed send could not be sent', () => {
    expect(signInMessage({ code: 'send_failed', retryAfterSeconds: null })).toBe(
      'We couldn’t send your code. Check your connection and try again.',
    );
  });

  it.each([
    [2501, 'Too many codes asked for. Try again in 42 minutes.'],
    [2520, 'Too many codes asked for. Try again in 42 minutes.'],
    [30, 'Too many codes asked for. Try again in 1 minute.'],
    [null, 'Too many codes asked for. Try again in 60 minutes.'],
  ])('says when to try again after %j seconds, in minutes rounded up', (seconds, words) => {
    expect(signInMessage({ code: 'rate_limited', retryAfterSeconds: seconds })).toBe(words);
  });

  it.each(['invalid_email', 'resend_too_soon'] as const)('leaves %s to its own place', (code) => {
    expect(signInMessage({ code, retryAfterSeconds: 12 })).toBeNull();
  });

  it('says nothing when nothing was refused', () => {
    expect(signInMessage(null)).toBeNull();
  });
});
