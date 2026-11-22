import { InjectionToken, type Signal } from '@angular/core';

/** The link to the ride hub (docs/detailed-designs/multiplayer/connect-to-the-ride-hub). */
export type RideHubState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

/**
 * The ride hub at `/hubs/ride`, for live races and group classes (L2-120). The only way the app talks to the hub: no
 * component opens its own connection. Bound by the routes that hold a live session, never by `app.config.ts`, so the
 * rest of the app holds no connection (AC4). The session methods arrive with the slices that use them (14.3 to 15).
 */
export interface RideHubClient {
  readonly state: Signal<RideHubState>;
  /** Opens the connection with the session cookie (AC1); it rejects when the hub refuses it (AC2). */
  start(): Promise<void>;
  /** Closes the connection and its retry timer. */
  stop(): Promise<void>;
  /** The hub's time in Unix milliseconds, for the clock offset (L2-121 AC3). */
  serverTime(): Promise<number>;
  /** Runs `handler` after each reconnect (AC3); returns what removes it. */
  onReconnected(handler: () => void): () => void;
}

export const RIDE_HUB_CLIENT = new InjectionToken<RideHubClient>('RIDE_HUB_CLIENT');
