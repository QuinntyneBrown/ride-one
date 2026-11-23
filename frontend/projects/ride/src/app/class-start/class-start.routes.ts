import type { Routes } from '@angular/router';
import { provideClassVideo } from '../classes/provide-class-video';
import { provideClasses } from '../classes/provide-classes';

/**
 * Class Start's route at `/`, loaded with it: the catalogue client and the video's
 * player are bound here, so their code stays out of the other screens' chunks (AGENTS.md, lazy loading first). The
 * page provides its own store, which goes when the rider leaves.
 */
export const classStartRoutes: Routes = [
  {
    path: '',
    title: 'Telo Ride',
    providers: [provideClasses(), provideClassVideo()],
    loadComponent: () => import('./class-start-page'),
  },
];
