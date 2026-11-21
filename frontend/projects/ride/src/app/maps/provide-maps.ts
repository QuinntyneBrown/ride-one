import { provideHttpClient, withFetch } from '@angular/common/http';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { HttpMapsApi, MAPS_API } from '@telo/api';

/** The map catalogue's client for the routes that read it (ADR 0029). */
export function provideMaps(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withFetch()),
    HttpMapsApi,
    { provide: MAPS_API, useExisting: HttpMapsApi },
  ];
}
