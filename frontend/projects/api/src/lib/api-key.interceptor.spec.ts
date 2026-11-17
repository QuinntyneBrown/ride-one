import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { apiKeyInterceptor, UNAUTHORIZED_HANDLER } from './api-key.interceptor';
import { ApiKeyStore } from './api-key.store';

describe('apiKeyInterceptor', () => {
  let unauthorized: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    unauthorized = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiKeyInterceptor])),
        provideHttpClientTesting(),
        { provide: UNAUTHORIZED_HANDLER, useValue: unauthorized },
      ],
    });
  });

  it('adds the key to /api requests only', () => {
    TestBed.inject(ApiKeyStore).set('k-1');
    const http = TestBed.inject(HttpClient);
    const ctl = TestBed.inject(HttpTestingController);
    void firstValueFrom(http.get('/api/status'));
    void firstValueFrom(http.get('/fonts/inter.woff2'));
    expect(ctl.expectOne('/api/status').request.headers.get('X-Api-Key')).toBe('k-1');
    expect(ctl.expectOne('/fonts/inter.woff2').request.headers.has('X-Api-Key')).toBe(false);
  });

  it('forgets the key and hands a 401 to the app', async () => {
    const keys = TestBed.inject(ApiKeyStore);
    keys.set('wrong');
    const result = firstValueFrom(TestBed.inject(HttpClient).get('/api/status')).catch(
      (e: unknown) => e,
    );
    TestBed.inject(HttpTestingController)
      .expectOne('/api/status')
      .flush(null, { status: 401, statusText: 'Unauthorized' });
    await result;
    expect(keys.key()).toBeNull();
    expect(unauthorized).toHaveBeenCalledTimes(1);
  });
});
