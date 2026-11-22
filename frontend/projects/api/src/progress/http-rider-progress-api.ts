import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ProgressDto } from './progress-dto';
import type { RiderProgressApi } from './rider-progress-api';

/** The rider's progress over HTTP: `GET /api/progress`, with the session cookie. */
@Injectable()
export class HttpRiderProgressApi implements RiderProgressApi {
  private readonly http = inject(HttpClient);

  progress(): Observable<ProgressDto> {
    return this.http.get<ProgressDto>('/api/progress');
  }
}
