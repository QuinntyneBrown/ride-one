import { provideHttpClient, withFetch } from '@angular/common/http';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { CLASSES_API, HttpClassesApi, MONOTONIC_TIME } from '@telo/api';

/**
 * What the class ride route binds (ride.routes.ts): the class catalogue over HTTP and the monotonic clock the ride
 * runs on (`performance.now()`, L2-133 AC1). Bound on the route, so their code loads with the class ride.
 */
export function provideClassRide(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withFetch()),
    { provide: CLASSES_API, useClass: HttpClassesApi },
    { provide: MONOTONIC_TIME, useValue: { now: () => performance.now() } },
  ];
}
