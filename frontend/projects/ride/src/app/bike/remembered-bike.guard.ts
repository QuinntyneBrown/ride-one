import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { BIKE_CONNECTION, BLUETOOTH_SUPPORT, REMEMBERED_BIKE } from '@telo/api';

/**
 * The class's guard (L2-015 AC1, L2-167). A rider whose browser remembers a bike goes to the class, and the app starts
 * reconnecting to it without the chooser, without waiting. A rider with no bike whose browser can reach one goes to
 * Connect Bike; a browser that cannot still opens the class (L2-010 AC5).
 */
export const rememberedBikeGuard: CanActivateFn = () => {
  const remembered = inject(REMEMBERED_BIKE).get();
  if (remembered) {
    void inject(BIKE_CONNECTION).reconnectRemembered(remembered);
    return true;
  }
  if (inject(BLUETOOTH_SUPPORT).state() !== 'ready') return true;
  return inject(Router).createUrlTree(['/connect']);
};
