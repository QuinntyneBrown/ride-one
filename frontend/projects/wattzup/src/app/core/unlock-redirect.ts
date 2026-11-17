// Where a refused API key leads: the unlock page, returning to where the rider was (L2-055).
// Bound to UNAUTHORIZED_HANDLER in app.config.ts.
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export function redirectToUnlock(): () => void {
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
