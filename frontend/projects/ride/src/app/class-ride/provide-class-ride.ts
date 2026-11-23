import type { EnvironmentProviders, Provider } from '@angular/core';
import { MONOTONIC_TIME, SCREEN_WAKE_LOCK, WORLD_RENDERER } from '@telo/api';
import { BrowserScreenWakeLock } from '@telo/domain';
import { provideClassVideo } from '../classes/provide-class-video';
import { provideTheClass } from '../classes/provide-the-class';

/**
 * What the class ride route binds (ride.routes.ts): the one class, shipped with the app
 * (ADR 0037), the monotonic clock the ride runs
 * on (`performance.now()`, L2-133 AC1), the screen wake lock (AC3) and the class video's player, whose `video` library
 * is imported only when a ride plays its video, and the world's renderer, which `main`'s `WorldScene` asks for: the class ride
 * draws with the one World loading warmed up, so it is imported with the world library only if it is ever loaded. Bound on the route, so their code loads with the class ride.
 */
export function provideClassRide(): (Provider | EnvironmentProviders)[] {
  return [
    provideTheClass(),
    { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
    { provide: SCREEN_WAKE_LOCK, useClass: BrowserScreenWakeLock },
    provideClassVideo(),
    {
      provide: WORLD_RENDERER,
      useValue: () => import('@telo/world').then((world) => world.loadWorldRenderer()),
    },
  ];
}
