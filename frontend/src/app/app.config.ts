// Composition root: binds every contract to its implementation.
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { apiKeyInterceptor } from './core/api-key.interceptor';
import { BIKE_API } from './core/bike-api';
import { HttpBikeApi, HttpMachineApi, HttpWorkoutApi } from './core/http-api';
import { MACHINE_API } from './core/machine-api';
import { ThemeService } from './core/theme.service';
import { WORKOUT_API } from './core/workout-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAppInitializer(() => void inject(ThemeService)),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiKeyInterceptor])),
    { provide: BIKE_API, useClass: HttpBikeApi },
    { provide: WORKOUT_API, useClass: HttpWorkoutApi },
    { provide: MACHINE_API, useClass: HttpMachineApi },
  ],
};
