import { Injectable } from '@angular/core';
import type { MapProgressDto, ProgressApi } from '@telo/api';
import { type Observable, of } from 'rxjs';

/**
 * `PROGRESS_API` before the backend keeps progress (journey 10): a rider with no progress is a new rider, at level 1
 * (L2-043 AC2), so the classes of the higher tiers stay locked, with Prairie Paceline and Old Town Criterium open, no
 * stars, no best, and Cliffside Coast the next unlock (L2-040 AC1, L2-041 AC1). The backend's `ProgressApi` takes its
 * place with the same contract.
 */
@Injectable()
export class NewRiderProgress implements ProgressApi {
  level(): Observable<number> {
    return of(1);
  }

  maps(): Observable<MapProgressDto> {
    return of({
      openMapIds: ['prairie-paceline', 'old-town-criterium'],
      nextUnlockId: 'cliffside-coast',
      stars: {},
      bestTimeSeconds: {},
    });
  }
}
