import { TestBed } from '@angular/core/testing';
import { AUTH_API, AuthApiError, type AuthApi, TICKER } from '@telo/api';
import { Subject, type Observable, of, throwError } from 'rxjs';
import { RESEND_SECONDS, SignInStore } from './sign-in-store';

describe('SignInStore (L2-001 AC2, AC3, AC5; L2-003 AC1, AC2, AC4)', () => {
  let beat: Subject<number>;
  let answer: () => Observable<void>;
  let sentTo: string[];

  beforeEach(() => {
    beat = new Subject<number>();
    sentTo = [];
    answer = () => of(undefined);
    const auth: AuthApi = {
      sendCode: (email) => {
        sentTo.push(email);
        return answer();
      },
    };
    TestBed.configureTestingModule({
      providers: [
        SignInStore,
        { provide: AUTH_API, useValue: auth },
        { provide: TICKER, useValue: { seconds: beat } },
      ],
    });
  });

  const store = () => TestBed.inject(SignInStore);
  const tick = (seconds: number) => {
    for (let second = 0; second < seconds; second++) beat.next(second + 1);
  };

  it('sends the trimmed address and opens the code screen with the countdown at 30 seconds', async () => {
    expect(await store().send('  ada@example.com ')).toBe(true);
    expect(sentTo).toEqual(['ada@example.com']);
    expect(store().sentTo()).toBe('ada@example.com');
    expect(store().email()).toBe('  ada@example.com ');
    expect(store().resendSecondsLeft()).toBe(RESEND_SECONDS);
    expect(store().sending()).toBe(false);
  });

  it('sends nothing for an address that is not one, and marks it invalid', async () => {
    expect(await store().send('ada@example')).toBe(false);
    expect(sentTo).toEqual([]);
    expect(store().error()).toEqual({ code: 'invalid_email', retryAfterSeconds: null });
  });

  it('is busy while the request runs', async () => {
    const pending = new Subject<void>();
    answer = () => pending;
    const sending = store().send('ada@example.com');
    expect(store().sending()).toBe(true);
    pending.next();
    pending.complete();
    await sending;
    expect(store().sending()).toBe(false);
  });

  it('keeps the email and the refusal when the send fails, and stays on sign-in', async () => {
    answer = () => throwError(() => new AuthApiError('send_failed', null, 'down'));
    expect(await store().send('ada@example.com')).toBe(false);
    expect(store().email()).toBe('ada@example.com');
    expect(store().sentTo()).toBeNull();
    expect(store().error()).toEqual({ code: 'send_failed', retryAfterSeconds: null });
  });

  it('counts an error that is not the API’s as a failed send', async () => {
    answer = () => throwError(() => new Error('offline'));
    expect(await store().send('ada@example.com')).toBe(false);
    expect(store().error()?.code).toBe('send_failed');
  });

  it('keeps when to try again for too many codes', async () => {
    answer = () => throwError(() => new AuthApiError('rate_limited', 2501, 'busy'));
    expect(await store().send('ada@example.com')).toBe(false);
    expect(store().error()).toEqual({ code: 'rate_limited', retryAfterSeconds: 2501 });
  });

  it('opens the code screen for a code sent moments ago, counting down what is left', async () => {
    answer = () => throwError(() => new AuthApiError('resend_too_soon', 12, 'soon'));
    expect(await store().send('ada@example.com')).toBe(true);
    expect(store().error()).toBeNull();
    expect(store().resendSecondsLeft()).toBe(12);
  });

  it('counts down once a second to zero, then stops', async () => {
    await store().send('ada@example.com');
    tick(2);
    expect(store().resendSecondsLeft()).toBe(28);
    tick(40);
    expect(store().resendSecondsLeft()).toBe(0);
  });

  it('resends only after the countdown, to the same address, and says so', async () => {
    await store().send('ada@example.com');
    await store().resend();
    expect(sentTo).toEqual(['ada@example.com']);

    tick(RESEND_SECONDS);
    await store().resend();

    expect(sentTo).toEqual(['ada@example.com', 'ada@example.com']);
    expect(store().resent()).toBe(true);
    expect(store().resendSecondsLeft()).toBe(RESEND_SECONDS);
  });

  it('keeps a refused resend’s reason and confirms nothing', async () => {
    await store().send('ada@example.com');
    tick(RESEND_SECONDS);
    answer = () => throwError(() => new AuthApiError('rate_limited', 600, 'busy'));
    await store().resend();
    expect(store().resent()).toBe(false);
    expect(store().error()).toEqual({ code: 'rate_limited', retryAfterSeconds: 600 });
  });

  it('forgets the code screen’s refusal when the rider changes the email', async () => {
    answer = () => throwError(() => new AuthApiError('send_failed', null, 'down'));
    await store().send('ada@example.com');
    store().changeEmail();
    expect(store().error()).toBeNull();
  });
});
