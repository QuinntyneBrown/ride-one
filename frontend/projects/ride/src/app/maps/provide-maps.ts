import { provideHttpClient, withFetch } from '@angular/common/http';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { HttpMapsApi, MAPS_API } from '@telo/api';
import { CachedMapsApi, MapCatalogueCache } from '@telo/domain';

/** The map catalogue's client for the routes that read it, keeping the last catalogue on the device (ADR 0029). */
export function provideMaps(): (Provider | EnvironmentProviders)[] {
  return [
    provideHttpClient(withFetch()),
    HttpMapsApi,
    MapCatalogueCache,
    { provide: MAPS_API, useClass: CachedMapsApi },
  ];
}
