// The real YouTube player: the IFrame player API, loaded on first use (ADR 0012, L2-076 AC8).
import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import type { PlayerHandle, PlayerState, YouTubePlayer } from './youtube-player';

export const IFRAME_API = 'https://www.youtube.com/iframe_api';
export const EMBED_ORIGIN = 'https://www.youtube-nocookie.com';
/** How long a play call may go without `playing` before it counts as refused. */
export const REFUSED_AFTER_MS = 1500;

interface YtPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  getVideoData?(): { title?: string };
  destroy(): void;
}
interface YtNamespace {
  Player: new (
    el: HTMLIFrameElement,
    opts: {
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
        onError: (e: { data: number }) => void;
      };
    },
  ) => YtPlayer;
}
type YtWindow = Window & { YT?: YtNamespace; onYouTubeIframeAPIReady?: () => void };

const STATES: Record<number, PlayerState> = {
  [-1]: 'unstarted',
  0: 'ended',
  1: 'playing',
  2: 'paused',
  3: 'buffering',
  5: 'unstarted',
};

/** The embed address, built from the id alone, never from a submitted link (L2-076 AC8). */
export function embedSrc(videoId: string, startSeconds: number, origin: string): string {
  const query = new URLSearchParams({
    enablejsapi: '1',
    playsinline: '1',
    rel: '0',
    start: String(Math.floor(startSeconds)),
    origin,
  });
  return `${EMBED_ORIGIN}/embed/${encodeURIComponent(videoId)}?${query}`;
}

@Injectable()
export class IframeYouTubePlayer implements YouTubePlayer {
  private readonly document = inject(DOCUMENT);
  private api: Promise<YtNamespace> | null = null;

  private load(): Promise<YtNamespace> {
    const win = this.document.defaultView as YtWindow;
    this.api ??= new Promise<YtNamespace>((resolve, reject) => {
      if (win.YT?.Player) return resolve(win.YT);
      const previous = win.onYouTubeIframeAPIReady;
      win.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(win.YT!);
      };
      const script = this.document.createElement('script');
      script.src = IFRAME_API;
      script.async = true;
      script.onerror = () => {
        this.api = null;
        reject(new Error('The YouTube player did not load.'));
      };
      this.document.head.appendChild(script);
    });
    return this.api;
  }

  async create(host: HTMLElement, videoId: string, startSeconds: number): Promise<PlayerHandle> {
    const yt = await this.load();
    const win = this.document.defaultView!;
    const iframe = this.document.createElement('iframe');
    iframe.src = embedSrc(videoId, startSeconds, win.location.origin);
    iframe.title = 'Ride-along video';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.setAttribute('allowfullscreen', '');
    // Fills the host; set through the CSSOM, which the CSP allows (no style attribute in markup).
    Object.assign(iframe.style, { display: 'block', width: '100%', height: '100%', border: '0' });
    host.replaceChildren(iframe);

    const state = signal<PlayerState>('unstarted');
    const refused = signal(0);
    const error = signal<number | null>(null);
    let pendingPlay: ReturnType<typeof setTimeout> | null = null;
    let ready: () => void = () => undefined;
    const isReady = new Promise<void>((r) => (ready = r));
    const clearPending = () => {
      if (pendingPlay !== null) clearTimeout(pendingPlay);
      pendingPlay = null;
    };
    const player = new yt.Player(iframe, {
      events: {
        onReady: () => ready(),
        onStateChange: (e) => {
          const next = STATES[e.data] ?? 'unstarted';
          state.set(next);
          if (next === 'playing') {
            clearPending();
            refused.set(0);
          }
        },
        onError: (e) => error.set(e.data),
      },
    });
    await isReady;

    return {
      state: state.asReadonly(),
      refused: refused.asReadonly(),
      error: error.asReadonly(),
      seek: (seconds) => player.seekTo(seconds, true),
      play: () => {
        player.playVideo();
        if (state() === 'playing' || pendingPlay !== null) return;
        pendingPlay = setTimeout(() => {
          pendingPlay = null;
          if (state() !== 'playing') refused.update((n) => n + 1);
        }, REFUSED_AFTER_MS);
      },
      pause: () => {
        clearPending();
        player.pauseVideo();
      },
      currentTime: () => player.getCurrentTime(),
      title: () => player.getVideoData?.().title ?? '',
      destroy: () => {
        clearPending();
        player.destroy();
        host.replaceChildren();
      },
    };
  }
}
