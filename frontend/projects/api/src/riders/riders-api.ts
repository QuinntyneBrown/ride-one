import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';

/** Who is signed in (Stay signed in). */
export interface RiderMe {
  readonly id: string;
  readonly displayName: string | null;
}

/** The signed-in rider: `GET /api/riders/me`, which answers 401 when there is no session. */
export interface RidersApi {
  me(): Observable<RiderMe>;
}

export const RIDERS_API = new InjectionToken<RidersApi>('RIDERS_API');
