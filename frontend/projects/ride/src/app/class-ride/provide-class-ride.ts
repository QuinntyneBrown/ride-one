import { provideHttpClient, withFetch } from '@angular/common/http';
import type { EnvironmentProviders, Provider } from '@angular/core';
import {
  CLASSES_API,
  HttpClassesApi,
  MONOTONIC_TIME,
  SCREEN_WAKE_LOCK,
  VIDEO_PLAYER_FACTORY,
} from '@telo/api';
import { BrowserScreenWakeLock, CachedClassesApi, CatalogueCache } from '@telo/domain';

/**
 * What the class ride route binds (ride.routes.ts): the class catalogue over HTTP, kept on the device
 * (ADR 0028), the monotonic clock the ride runs
 * on (`performance.now()`, L2-133 AC1), the screen wake lock (AC3) and the class video's player, whose `video` library is imported only when a
 * ride plays its video. Bound on the route, so their code loads with the class ride.
 */
export function provideClassRide(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withFetch()),
    HttpClassesApi,
    CatalogueCache,
    { provide: CLASSES_API, useClass: CachedClassesApi },
    { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
    { provide: SCREEN_WAKE_LOCK, useClass: BrowserScreenWakeLock },
    {
      provide: VIDEO_PLAYER_FACTORY,
      useValue: () => import('@telo/video').then((video) => new video.YouTubeVideoPlayer()),
    },
  ];
}
