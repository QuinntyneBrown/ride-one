// Composition root: binds every contract to its implementation.
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { apiKeyInterceptor } from './core/api-key.interceptor';
import { BIKE_API } from './core/bike-api';
import { HttpBikeApi, HttpWorkoutApi } from './core/http-api';
import { WORKOUT_API } from './core/workout-api';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([apiKeyInterceptor])),
    { provide: BIKE_API, useClass: HttpBikeApi },
    { provide: WORKOUT_API, useClass: HttpWorkoutApi },
  ],
};
