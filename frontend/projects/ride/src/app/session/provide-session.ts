import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { CURRENT_RIDER, HttpRidersApi, RIDERS_API, sessionInterceptor } from '@telo/api';
import { CurrentRiderStore } from './current-rider-store';

/**
 * The one `HttpClient` every screen uses, which reports a 401 to the current rider, and the current rider itself
 * (Stay signed in). Bound on the screens' lazy parent route, out of the initial bundle.
 */
export function provideSession(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withFetch(), withInterceptors([sessionInterceptor])),
    { provide: RIDERS_API, useClass: HttpRidersApi },
    CurrentRiderStore,
    { provide: CURRENT_RIDER, useExisting: CurrentRiderStore },
  ];
}
