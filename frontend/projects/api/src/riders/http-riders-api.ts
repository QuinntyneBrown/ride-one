import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { RiderMe, RidersApi } from './riders-api';

/** The signed-in rider's HTTP client: `GET /api/riders/me` and `PUT /api/riders/me/display-name`. */
@Injectable()
export class HttpRidersApi implements RidersApi {
  private readonly http = inject(HttpClient);

  me(): Observable<RiderMe> {
    return this.http.get<RiderMe>('/api/riders/me');
  }

  setDisplayName(name: string): Observable<RiderMe> {
    return this.http.put<RiderMe>('/api/riders/me/display-name', { displayName: name });
  }
}
