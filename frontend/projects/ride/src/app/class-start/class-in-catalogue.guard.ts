import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { CLASSES_API } from '@telo/api';
import { catchError, map, of, take } from 'rxjs';

/**
 * Lets Class Start open for any class the catalogue holds: Telo Ride 1 locks none (ADR 0039). An address for a class
 * it does not hold, or no catalogue at all, opens the Class Library instead, which explains (L2-082 AC4).
 */
export const classInCatalogueGuard: CanActivateFn = (route) => {
  const library = inject(Router).parseUrl('/classes');
  return inject(CLASSES_API)
    .get(route.paramMap.get('id') ?? '')
    .pipe(
      take(1),
      map(() => true as const),
      catchError(() => of(library)),
    );
};
