import { inject } from '@angular/core';
import {
  type ActivatedRouteSnapshot,
  type CanActivateChildFn,
  Router,
  type RouterStateSnapshot,
} from '@angular/router';
import { CURRENT_RIDER } from '@telo/api';

/**
 * Every screen but sign-in, the code screen and not-found needs a rider (L2-001 AC1): when the session has ended, the
 * screen asked for opens sign-in, which returns to it. When the backend cannot be reached, the screen opens all the
 * same, so a ride never waits for the network (L2-004 AC5).
 */
export const authGuard: CanActivateChildFn = async (_child, state) => {
  const rider = inject(CURRENT_RIDER);
  const router = inject(Router);
  if (openToAll(state)) {
    return true;
  }
  return (
    (await rider.load()) !== 'signedOut' ||
    router.createUrlTree(['/sign-in'], { queryParams: { returnUrl: state.url } })
  );
};

function openToAll(state: RouterStateSnapshot): boolean {
  let leaf: ActivatedRouteSnapshot = state.root;
  while (leaf.firstChild) {
    leaf = leaf.firstChild;
  }
  return state.url.startsWith('/sign-in') || leaf.routeConfig?.path === '**';
}
