import type { Page, Request } from '@playwright/test';

/**
 * What a handler answers: a status (200 by default), a JSON body (none for 204) and any headers, such as Retry-After; or,
 * with `offline`, no answer at all, as when the network is down.
 */
export interface ApiReply {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  offline?: true;
}

type Handler = (request: Request) => ApiReply | Promise<ApiReply>;

/**
 * What the backend answers for a ride it records (Record a ride), for a new rider's first ride: "Finished" +100 and a
 * 1-day streak +10, and for a race its first star and its first best, the ride's own time. Every spec's finished ride is
 * recorded unless the spec answers `POST /api/rides` itself.
 */
const RIDE_RECORDED: Handler = (request) => {
  const ride = request.postDataJSON() as { rideId: string; kind: string; elapsedSeconds: number };
  const race = ride.kind === 'race';
  return {
    status: 201,
    body: {
      rideId: ride.rideId,
      recordedAt: '2026-11-21T07:00:00Z',
      xpLines: [
        { kind: 'finished', label: 'Finished', xp: 100 },
        { kind: 'streak', label: '1-day streak', xp: 10 },
      ],
      xpTotal: 110,
      totalXp: 110,
      level: 1,
      levelUp: false,
      nextLevelXp: 400,
      xpToNextLevel: 290,
      stars: race ? { held: 1, earned: 1 } : null,
      best: race
        ? { bestSeconds: ride.elapsedSeconds, previousBestSeconds: null, isNewBest: false }
        : null,
      openedMapId: null,
    },
  };
};

/** A new rider's progress (L2-038): level 1, no XP, 400 XP to level 2. Every spec's rider has it unless it answers. */
export const newRiderProgress = { level: 1, totalXp: 0, nextLevelXp: 400, streakDays: 0 };

/** The mocks' mid rider (L2-032 AC2): level 7 with 1,840 of 2,600 XP, on a 4-day streak. */
export const midRiderProgress = { level: 7, totalXp: 1840, nextLevelXp: 2600, streakDays: 4 };

/** The rider every spec is signed in as, unless it calls `signedOut()` (L2-004). */
export const signedInRider = { id: '3f2b8c1e-0d6a-4c8e-9b1f-5a7d2e9c4b10', displayName: 'Ada' };

const SESSION_ENDED: ApiReply = {
  status: 401,
  body: { status: 401, title: 'Sign in to continue.', code: 'unauthenticated' },
};

/**
 * Answers the app's requests to the backend (`/api/…` on localhost) with what the spec declared (L2-148 AC1). A request
 * no answer matches gets 501, and the shared fixture fails the spec. The latest answer for a method and path wins, so
 * a spec can change one mid-test; `requests` lists what the page sent, in order, and `sentBodies` the JSON it sent.
 * Every spec starts signed in as `signedInRider`, a new rider, and its finished rides are recorded; `signedOut()` ends the
 * session.
 */
export class ApiFixture {
  private readonly answers = new Map<string, Handler>();
  private readonly sent: string[] = [];
  private readonly bodies: { readonly key: string; readonly body: unknown }[] = [];
  private readonly missed: string[] = [];

  private constructor() {}

  static async install(page: Page): Promise<ApiFixture> {
    const api = new ApiFixture();
    api.answer('GET', '/api/riders/me', signedInRider);
    api.answer('POST', '/api/rides', RIDE_RECORDED);
    api.answer('GET', '/api/progress', newRiderProgress);
    await page.route(
      (url) =>
        ['localhost', '127.0.0.1'].includes(url.hostname) && url.pathname.startsWith('/api/'),
      async (route) => {
        const request = route.request();
        const key = `${request.method()} ${new URL(request.url()).pathname}`;
        api.sent.push(key);
        if (request.postData() !== null) api.bodies.push({ key, body: request.postDataJSON() });
        const handler = api.answers.get(key);
        if (!handler) {
          api.missed.push(key);
          await route.fulfill({
            status: 501,
            contentType: 'application/problem+json',
            body: '{"code":"unanswered"}',
          });
          return;
        }
        const reply = await handler(request);
        if (reply.offline) {
          await route.abort('internetdisconnected');
          return;
        }
        const status = reply.status ?? 200;
        const headers = reply.headers;
        await route.fulfill(
          reply.body === undefined
            ? { status, headers }
            : {
                status,
                headers,
                contentType: status >= 400 ? 'application/problem+json' : 'application/json',
                body: JSON.stringify(reply.body),
              },
        );
      },
    );
    return api;
  }

  /** Answers `method path` with 200 and `body`, or with whatever `handler` returns for the request. */
  answer(method: string, path: string, reply: Handler | unknown): void {
    this.answers.set(
      `${method} ${path}`,
      typeof reply === 'function' ? (reply as Handler) : () => ({ status: 200, body: reply }),
    );
  }

  /** No session: `GET /api/riders/me` answers 401, as for a visitor or a session that has ended. */
  signedOut(): void {
    this.answer('GET', '/api/riders/me', () => SESSION_ENDED);
  }

  /** The answer an endpoint gives once the session has ended. */
  static readonly sessionEnded: ApiReply = SESSION_ENDED;

  /** Every request the page sent to the backend, as "METHOD /path", oldest first. */
  requests(): string[] {
    return [...this.sent];
  }

  /** The JSON bodies the page sent with `method path`, oldest first. */
  sentBodies(method: string, path: string): unknown[] {
    return this.bodies.filter((sent) => sent.key === `${method} ${path}`).map((sent) => sent.body);
  }

  /** The requests no answer matched; the shared fixture fails the spec when there are any. */
  unanswered(): string[] {
    return [...this.missed];
  }
}
