import type { Page, Request } from '@playwright/test';

/** What a handler answers: a status (200 by default) and a JSON body (none for 204). */
export interface ApiReply {
  status?: number;
  body?: unknown;
}

type Handler = (request: Request) => ApiReply | Promise<ApiReply>;

/**
 * Answers the app's requests to the backend (`/api/…` on localhost) with what the spec declared (L2-148 AC1). A request
 * no answer matches gets 501, and the shared fixture fails the spec. The latest answer for a method and path wins, so
 * a spec can change one mid-test; `requests` lists what the page sent, in order.
 */
export class ApiFixture {
  private readonly answers = new Map<string, Handler>();
  private readonly sent: string[] = [];
  private readonly missed: string[] = [];

  private constructor() {}

  static async install(page: Page): Promise<ApiFixture> {
    const api = new ApiFixture();
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
        await route.fulfill(
          reply.body === undefined
            ? { status }
            : { status, contentType: 'application/json', body: JSON.stringify(reply.body) },
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

  /** Every request the page sent to the backend, as "METHOD /path", oldest first. */
  requests(): string[] {
    return [...this.sent];
  }

  /** The requests no answer matched; the shared fixture fails the spec when there are any. */
  unanswered(): string[] {
    return [...this.missed];
  }
}
