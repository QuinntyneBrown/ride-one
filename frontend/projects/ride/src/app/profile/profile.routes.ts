import type { Routes } from '@angular/router';
import { provideInertBehindDialogs } from '../dialogs/provide-inert-behind-dialogs';

/** Profile, loaded with it: the app goes inert behind its Diagnostics dialog (L2-141 AC3). */
export const profileRoutes: Routes = [
  {
    path: '',
    providers: [provideInertBehindDialogs()],
    loadComponent: () => import('./profile-page'),
  },
];
