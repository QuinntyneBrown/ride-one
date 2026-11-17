// The machine, speed and incline API contract (L2-062, L2-069). Components inject MACHINE_API,
// never HttpMachineApi.
import { InjectionToken } from '@angular/core';
import type { Machine } from './api-types';

export interface MachineApi {
  /** POST /api/machine {machine} */
  choose(machine: Machine): Promise<void>;
  /** POST /api/speed {speed}; rejects with RequestTimeoutError after 5 s. */
  setSpeed(speed: number): Promise<void>;
  /** POST /api/incline {incline}; rejects with RequestTimeoutError after 5 s. */
  setIncline(incline: number): Promise<void>;
}

export const MACHINE_API = new InjectionToken<MachineApi>('MACHINE_API');
