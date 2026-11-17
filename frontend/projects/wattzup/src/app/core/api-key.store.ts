// The API key for this browser session (L2-055). Never logged, never put in a URL.
import { Injectable, signal } from '@angular/core';
import { SafeStorage } from './safe-storage';

const KEY = 'wattzup.apiKey';

@Injectable({ providedIn: 'root' })
export class ApiKeyStore {
  private readonly storage = new SafeStorage(() => sessionStorage);
  private readonly _key = signal<string | null>(this.storage.get(KEY));
  readonly key = this._key.asReadonly();

  set(key: string): void {
    this.storage.set(KEY, key);
    this._key.set(key);
  }

  clear(): void {
    this.storage.remove(KEY);
    this._key.set(null);
  }
}
