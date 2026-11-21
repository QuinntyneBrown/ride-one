import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import type { BluetoothSupport, BluetoothSupportState } from '@telo/api';

/**
 * Reads whether this browser and page can reach the bike. The secure context comes first: on a plain `http` page a
 * Chromium browser has no `navigator.bluetooth` either, and the fix there is the HTTPS page, not another browser.
 */
@Injectable()
export class WebBluetoothSupport implements BluetoothSupport {
  private readonly window = inject(DOCUMENT).defaultView as Window;
  private readonly current = signal(this.read());

  readonly state = this.current.asReadonly();

  async recheck(): Promise<BluetoothSupportState> {
    this.current.set(this.read());
    return this.current();
  }

  secureUrl(): string {
    const { host, pathname, search, hash } = this.window.location;
    return `https://${host}${pathname}${search}${hash}`;
  }

  private read(): BluetoothSupportState {
    if (!this.window.isSecureContext) return 'insecure-context';
    if (!('bluetooth' in this.window.navigator)) return 'unsupported-browser';
    return 'ready';
  }
}
