import type { Routes } from '@angular/router';
import { provideClassVideo } from '../classes/provide-class-video';
import { provideTheClass } from '../classes/provide-the-class';

/**
 * Class Start's route at `/`, loaded with it: the one class (ADR 0037) and the video's
 * player are bound here, so their code stays out of the other screens' chunks (AGENTS.md, lazy loading first). The
 * page provides its own store, which goes when the rider leaves.
 */
export const classStartRoutes: Routes = [
  {
    path: '',
    title: 'Telo Ride 1',
    providers: [provideTheClass(), provideClassVideo()],
    loadComponent: () => import('./class-start-page'),
  },
];
