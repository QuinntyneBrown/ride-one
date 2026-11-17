// The app's answer to a 401: the unlock page, returning to where the rider was (L2-055).
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { UnauthorizedHandler } from '@wattzup/api';

/** Factory for UNAUTHORIZED_HANDLER; runs in an injection context. */
export function redirectToUnlock(): UnauthorizedHandler {
  const router = inject(Router);
  return () => {
    const current = router.currentNavigation();
    const returnUrl = current
      ? router.serializeUrl(current.finalUrl ?? current.extractedUrl)
      : router.url;
    if (!returnUrl.startsWith('/unlock')) {
      void router.navigate(['/unlock'], { queryParams: { returnUrl } });
    }
  };
}
