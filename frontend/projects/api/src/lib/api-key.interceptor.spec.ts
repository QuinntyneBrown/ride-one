import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SKIP_UNLOCK_REDIRECT,
  UNAUTHORIZED_HANDLER,
  apiKeyInterceptor,
} from './api-key.interceptor';
import { ApiKeyStore } from './api-key.store';

describe('apiKeyInterceptor (L2-035, L2-055)', () => {
  const unauthorized = vi.fn();
  let http: HttpClient;
  let backend: HttpTestingController;
  let keys: ApiKeyStore;

  beforeEach(() => {
    unauthorized.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiKeyInterceptor])),
        provideHttpClientTesting(),
        { provide: UNAUTHORIZED_HANDLER, useValue: unauthorized },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    keys = TestBed.inject(ApiKeyStore);
  });

  afterEach(() => {
    backend.verify();
    sessionStorage.clear();
  });

  it('adds X-Api-Key to an /api request when a key is kept', () => {
    keys.set('secret');
    void firstValueFrom(http.get('/api/status'));
    expect(backend.expectOne('/api/status').request.headers.get('X-Api-Key')).toBe('secret');
  });

  it('adds nothing outside /api', () => {
    keys.set('secret');
    void firstValueFrom(http.get('/health'));
    expect(backend.expectOne('/health').request.headers.has('X-Api-Key')).toBe(false);
  });

  it('clears the key and calls the handler on a 401', async () => {
    keys.set('secret');
    const response = firstValueFrom(http.get('/api/status'));
    backend.expectOne('/api/status').flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(keys.key()).toBeNull();
    expect(unauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not call the handler when the request skips the unlock redirect', async () => {
    const context = new HttpContext().set(SKIP_UNLOCK_REDIRECT, true);
    const response = firstValueFrom(http.get('/api/status', { context }));
    backend.expectOne('/api/status').flush(null, { status: 401, statusText: 'Unauthorized' });
    await expect(response).rejects.toMatchObject({ status: 401 });
    expect(unauthorized).not.toHaveBeenCalled();
  });

  it('does not call the handler on another error', async () => {
    const response = firstValueFrom(http.get('/api/status'));
    backend.expectOne('/api/status').flush(null, { status: 500, statusText: 'Error' });
    await expect(response).rejects.toMatchObject({ status: 500 });
    expect(unauthorized).not.toHaveBeenCalled();
  });
});
