// The composition root (L2-088, ADR 0017): binds every contract to its in-browser implementation.
// The only file that imports @wattzup/browser.
import {
  type ApplicationConfig,
  inject,
  isDevMode,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';
import { provideBrowserContracts } from '@wattzup/browser';
import { routes } from './app.routes';
import { ThemeService } from './core/theme.service';
import { IframeYouTubePlayer } from './core/iframe-youtube-player';
import { loadWorldRenderer } from './core/world-renderer-loader';
import { WORLD_RENDERER } from './core/world-renderer-port';
import { YOUTUBE_PLAYER } from './core/youtube-player';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAppInitializer(() => void inject(ThemeService)),
    provideRouter(routes, withComponentInputBinding()),
    provideBrowserContracts(),
    { provide: YOUTUBE_PLAYER, useClass: IframeYouTubePlayer },
    // Keeps the app for offline use (L2-098 AC1). A new version downloads in the background and
    // serves the next load; nothing activates it or reloads the page, so a ride is never
    // interrupted by an update (L2-098 AC3).
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: WORLD_RENDERER, useValue: loadWorldRenderer },
  ],
};
