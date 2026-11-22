import type { Page, Request } from '@playwright/test';

/** What a handler answers: a status (200 by default), a JSON body (none for 204) and any headers, such as Retry-After. */
export interface ApiReply {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

type Handler = (request: Request) => ApiReply | Promise<ApiReply>;

/** The rider every spec is signed in as, unless it calls `signedOut()` (L2-004). */
export const signedInRider = { id: '3f2b8c1e-0d6a-4c8e-9b1f-5a7d2e9c4b10', displayName: 'Ada' };

const SESSION_ENDED: ApiReply = {
  status: 401,
  body: { status: 401, title: 'Sign in to continue.', code: 'unauthenticated' },
};

/**
 * Answers the app's requests to the backend (`/api/…` on localhost) with what the spec declared (L2-148 AC1). A request
 * no answer matches gets 501, and the shared fixture fails the spec. The latest answer for a method and path wins, so
 * a spec can change one mid-test; `requests` lists what the page sent, in order. Every spec starts signed in as
 * `signedInRider`; `signedOut()` ends the session.
 */
export class ApiFixture {
  private readonly answers = new Map<string, Handler>();
  private readonly sent: string[] = [];
  private readonly missed: string[] = [];

  private constructor() {}

  static async install(page: Page): Promise<ApiFixture> {
    const api = new ApiFixture();
    api.answer('GET', '/api/riders/me', signedInRider);
    await page.route(
      (url) =>
        ['localhost', '127.0.0.1'].includes(url.hostname) && url.pathname.startsWith('/api/'),
      async (route) => {
        const request = route.request();
        const key = `${request.method()} ${new URL(request.url()).pathname}`;
        api.sent.push(key);
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

  /** The requests no answer matched; the shared fixture fails the spec when there are any. */
  unanswered(): string[] {
    return [...this.missed];
  }
}
