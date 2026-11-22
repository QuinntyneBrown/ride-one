import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import type { EnvironmentProviders, Provider } from '@angular/core';
import {
  CURRENT_RIDER,
  HttpRidersApi,
  HttpRidesApi,
  RIDERS_API,
  RIDES_API,
  RIDE_OUTBOX,
  sessionInterceptor,
} from '@telo/api';
import { SessionRideOutbox } from '@telo/domain';
import { CurrentRiderStore } from './current-rider-store';

/**
 * The one `HttpClient` every screen uses, which reports a 401 to the current rider, the current rider itself (Stay
 * signed in), and the outbox of finished rides with its client, shared by the race or class that submits a ride and the
 * Results that follows it. Bound on the screens' lazy parent route, out of the initial bundle.
 */
export function provideSession(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withFetch(), withInterceptors([sessionInterceptor])),
    { provide: RIDERS_API, useClass: HttpRidersApi },
    CurrentRiderStore,
    { provide: CURRENT_RIDER, useExisting: CurrentRiderStore },
    { provide: RIDES_API, useClass: HttpRidesApi },
    { provide: RIDE_OUTBOX, useClass: SessionRideOutbox },
  ];
}
