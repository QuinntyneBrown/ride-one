import type { EnvironmentProviders, Provider } from '@angular/core';
import { MONOTONIC_TIME, RIDE_HUB_CLIENT, SCREEN_WAKE_LOCK, SignalRRideHubClient } from '@telo/api';
import { BrowserScreenWakeLock } from '@telo/domain';
import { provideClassVideo } from '../classes/provide-class-video';
import { provideClasses } from '../classes/provide-classes';

/**
 * What the class ride route binds (ride.routes.ts): the class catalogue over HTTP, kept on the device
 * (ADR 0028), the monotonic clock the ride runs
 * on (`performance.now()`, L2-133 AC1), the screen wake lock (AC3) and the class video's player, whose `video` library
 * is imported only when a ride plays its video, and the ride hub's client, whose SignalR library is imported only when a
 * group ride joins its session (L2-120). Bound on the route, so their code loads with the class ride.
 */
export function provideClassRide(): (Provider | EnvironmentProviders)[] {
  return [
    ...provideClasses(),
    { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
    { provide: SCREEN_WAKE_LOCK, useClass: BrowserScreenWakeLock },
    provideClassVideo(),
    { provide: RIDE_HUB_CLIENT, useClass: SignalRRideHubClient },
  ];
}
