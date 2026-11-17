// The shared fixture. Every /api/** request is answered from a stub; an unanswered one fails
// the test. The event stream is stubbed in the page: EventSource is replaced before the app
// loads, so a test pushes state messages on demand and can fail the stream (L2-015, L2-054).
import { test as base, expect, type Page, type Request } from '@playwright/test';
import { state, type Json } from './states';
import { FakeYouTube } from './fake-youtube';

export { expect };

export interface StubResponse {
  status?: number;
  json?: unknown;
  /** Abort the request at the network level (server unreachable). */
  abort?: boolean;
  /** Never answer (the client times out). */
  hang?: boolean;
}

type Handler = StubResponse | ((request: Request) => StubResponse | Promise<StubResponse>);

export interface RecordedRequest {
  method: string;
  path: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
}

export class ApiStub {
  private readonly handlers = new Map<string, Handler>();
  readonly requests: RecordedRequest[] = [];
  readonly unanswered: string[] = [];

  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    this.on('GET', '/api/status', { json: state() });
    this.on('GET', '/api/workout/trace', { json: { samples: [] } });
    await this.page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const key = `${request.method()} ${url.pathname}`;
      let body: unknown = request.postData();
      try {
        body = request.postDataJSON();
      } catch {
        /* not JSON */
      }
      this.requests.push({
        method: request.method(),
        path: url.pathname,
        url: request.url(),
        headers: await request.allHeaders(),
        body,
      });
      const handler = this.handlers.get(key);
      if (!handler) {
        this.unanswered.push(key);
        await route.abort();
        return;
      }
      const res = typeof handler === 'function' ? await handler(request) : handler;
      if (res.hang) return;
      if (res.abort) {
        await route.abort('connectionrefused');
        return;
      }
      await route.fulfill({
        status: res.status ?? 200,
        contentType: 'application/json',
        body: JSON.stringify(res.json ?? {}),
      });
    });
  }

  /** Answers `METHOD path` with a stub response, or a function of the request. */
  on(method: string, path: string, handler: Handler): void {
    this.handlers.set(`${method} ${path}`, handler);
  }

  calls(method: string, path: string): RecordedRequest[] {
    return this.requests.filter((r) => r.method === method && r.path === path);
  }

  async waitForCall(method: string, path: string, count = 1): Promise<RecordedRequest[]> {
    await expect
      .poll(() => this.calls(method, path).length, { message: `${method} ${path} calls` })
      .toBeGreaterThanOrEqual(count);
    return this.calls(method, path);
  }
}

declare global {
  interface Window {
    __wzEvents: { sources: { url: string; closed: boolean }[] };
    __wzPush(data: string): boolean;
    __wzFail(): boolean;
  }
}

/** Replaces EventSource in the page before any app code runs. */
function installFakeEventSource(): void {
  const registry: { url: string; closed: boolean; target: FakeEventSource }[] = [];
  class FakeEventSource extends EventTarget {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSED = 2;
    readonly url: string;
    readyState = 0;
    withCredentials = false;
    onopen: ((e: Event) => void) | null = null;
    onmessage: ((e: MessageEvent) => void) | null = null;
    onerror: ((e: Event) => void) | null = null;
    constructor(url: string | URL) {
      super();
      this.url = new URL(String(url), location.href).toString();
      registry.push({ url: this.url, closed: false, target: this });
    }
    close(): void {
      this.readyState = 2;
      const entry = registry.find((r) => r.target === this);
      if (entry) entry.closed = true;
    }
    deliver(event: Event): void {
      const handler = (this as unknown as Record<string, ((e: Event) => void) | null>)[
        `on${event.type}`
      ];
      handler?.call(this, event);
      this.dispatchEvent(event);
    }
  }
  const open = (): FakeEventSource | undefined => registry.filter((r) => !r.closed).at(-1)?.target;
  Object.defineProperty(window, '__wzEvents', {
    get: () => ({ sources: registry.map((r) => ({ url: r.url, closed: r.closed })) }),
  });
  window.__wzPush = (data: string) => {
    const s = open();
    if (!s) return false;
    if (s.readyState === 0) {
      s.readyState = 1;
      s.deliver(new Event('open'));
    }
    s.deliver(new MessageEvent('message', { data }));
    return true;
  };
  window.__wzFail = () => {
    const s = open();
    if (!s) return false;
    s.deliver(new Event('error'));
    return true;
  };
  (window as unknown as { EventSource: unknown }).EventSource = FakeEventSource;
}

export class EventStreamStub {
  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    await this.page.addInitScript(installFakeEventSource);
  }

  /** Waits for an open stream, then delivers one `data:` message with the full state. */
  async push(message: Json): Promise<void> {
    const data = JSON.stringify({ ts: Date.now() / 1000, ...message });
    await expect
      .poll(() => this.page.evaluate((d) => window.__wzPush(d), data), {
        message: 'an open event stream to push to',
      })
      .toBe(true);
  }

  /** Fails the open stream as a dropped connection would. */
  async fail(): Promise<void> {
    await expect
      .poll(() => this.page.evaluate(() => window.__wzFail()), { message: 'an open event stream' })
      .toBe(true);
  }

  async connections(): Promise<{ url: string; closed: boolean }[]> {
    return this.page.evaluate(() => window.__wzEvents.sources);
  }
}

export interface Tone {
  frequency: number;
  duration: number;
}

/** Replaces AudioContext with a recorder of the tones played (L2-027). */
function installFakeAudio(): void {
  const tones: { frequency: number; duration: number }[] = [];
  (window as unknown as { __wzTones: typeof tones }).__wzTones = tones;
  class FakeParam {
    value = 0;
    setValueAtTime(v: number): this {
      this.value = v;
      return this;
    }
    linearRampToValueAtTime(): this {
      return this;
    }
    exponentialRampToValueAtTime(): this {
      return this;
    }
    cancelScheduledValues(): this {
      return this;
    }
  }
  class FakeNode {
    connect<T>(n: T): T {
      return n;
    }
    disconnect(): void {
      /* nothing */
    }
  }
  class FakeOscillator extends FakeNode {
    readonly frequency = new FakeParam();
    type = 'sine';
    private startAt = 0;
    onended: (() => void) | null = null;
    start(at = 0): void {
      this.startAt = at;
    }
    stop(at = 0): void {
      tones.push({
        frequency: this.frequency.value,
        duration: Math.round((at - this.startAt) * 1000) / 1000,
      });
    }
  }
  class FakeGain extends FakeNode {
    readonly gain = new FakeParam();
  }
  class FakeAudioContext {
    currentTime = 0;
    state = 'running';
    readonly destination = new FakeNode();
    createOscillator(): FakeOscillator {
      return new FakeOscillator();
    }
    createGain(): FakeGain {
      return new FakeGain();
    }
    resume(): Promise<void> {
      return Promise.resolve();
    }
    close(): Promise<void> {
      return Promise.resolve();
    }
  }
  (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
}

export class AudioRecorder {
  constructor(private readonly page: Page) {}

  async install(): Promise<void> {
    await this.page.addInitScript(installFakeAudio);
  }

  tones(): Promise<Tone[]> {
    return this.page.evaluate(() => (window as unknown as { __wzTones: Tone[] }).__wzTones.slice());
  }
}

export const test = base.extend<{
  api: ApiStub;
  events: EventStreamStub;
  audio: AudioRecorder;
  youtube: FakeYouTube;
}>({
  audio: async ({ page }, use) => {
    const audio = new AudioRecorder(page);
    await audio.install();
    await use(audio);
  },
  // Automatic, so no test can reach a real backend even when it never names them.
  api: [
    async ({ page }, use) => {
      const api = new ApiStub(page);
      await api.install();
      await use(api);
      expect(api.unanswered, 'unanswered /api requests').toEqual([]);
    },
    { auto: true },
  ],
  // Automatic: the YouTube player is always the fake, and nothing else off localhost loads.
  youtube: [
    async ({ page }, use) => {
      const youtube = new FakeYouTube(page);
      await youtube.install();
      await use(youtube);
      expect(youtube.offsite, 'requests off localhost').toEqual([]);
    },
    { auto: true },
  ],
  events: [
    async ({ page }, use) => {
      const events = new EventStreamStub(page);
      await events.install();
      await use(events);
    },
    { auto: true },
  ],
});
