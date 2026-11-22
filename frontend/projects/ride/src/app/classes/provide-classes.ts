import type { EnvironmentProviders, Provider } from '@angular/core';
import { CLASSES_API, HttpClassesApi } from '@telo/api';
import { CachedClassesApi, CatalogueCache } from '@telo/domain';

/**
 * The class catalogue over HTTP, kept on the device (ADR 0028), for the routes that read it: the Class Library and the
 * class ride. Bound on those routes, so the catalogue's code loads with them; `HttpClient` is the screens' own
 * (provideSession).
 */
export function provideClasses(): (Provider | EnvironmentProviders)[] {
  return [HttpClassesApi, CatalogueCache, { provide: CLASSES_API, useClass: CachedClassesApi }];
}
