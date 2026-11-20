// The class catalogue contract (L2-078, ADR 0014). Components inject CLASS_API.
import { InjectionToken } from '@angular/core';
import type { ClassCatalogue, ClassEntry } from './api-types';

export interface ClassApi {
  /** Every shelf that has a class, with its classes, in file order. */
  list(): Promise<ClassCatalogue>;
  /** One class; 'not-found' when there is none with this id. */
  get(id: string): Promise<ClassEntry | 'not-found'>;
}

export const CLASS_API = new InjectionToken<ClassApi>('CLASS_API');
