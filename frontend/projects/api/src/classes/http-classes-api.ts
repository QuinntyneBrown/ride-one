import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ClassDto } from './class-dto';
import type { ClassesApi } from './classes-api';

/** `CLASSES_API` over HTTP: `GET /api/classes/{id}` (ADR 0014). */
@Injectable()
export class HttpClassesApi implements ClassesApi {
  private readonly http = inject(HttpClient);

  get(id: string): Observable<ClassDto> {
    return this.http.get<ClassDto>(`/api/classes/${encodeURIComponent(id)}`);
  }
}
