import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { BLUETOOTH_SUPPORT } from '@telo/api';
import { isBlocked } from '@telo/domain';

/**
 * The class ride's guard in a blocked browser (L2-010 AC2): a browser that cannot reach a bike starts no ride, so the
 * ride's address opens `/` instead, which says why. It reads the support state alone and asks nothing of Bluetooth.
 */
export const blockedBrowserGuard: CanActivateFn = () => {
  return isBlocked(inject(BLUETOOTH_SUPPORT).state()) ? inject(Router).createUrlTree(['/']) : true;
};
