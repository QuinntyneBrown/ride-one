// Composition root, browser edition (L2-088, ADR 0017): swapped in for app.config.ts by the
// `browser` build configurations. Binds every contract to its in-browser implementation; there is
// no HttpClient, API key or UNAUTHORIZED_HANDLER. The only file that imports @wattzup/browser.
import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideBrowserEdition } from '@wattzup/browser';
import { routes } from './app.routes';
import { ThemeService } from './core/theme.service';
import { IframeYouTubePlayer } from './core/iframe-youtube-player';
import { YOUTUBE_PLAYER } from './core/youtube-player';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAppInitializer(() => void inject(ThemeService)),
    provideRouter(routes, withComponentInputBinding()),
    provideBrowserEdition(),
    { provide: YOUTUBE_PLAYER, useClass: IframeYouTubePlayer },
  ],
};
