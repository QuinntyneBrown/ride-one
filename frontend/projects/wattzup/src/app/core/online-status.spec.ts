import { TestBed } from '@angular/core/testing';
import { OnlineStatus } from './online-status';

describe('OnlineStatus (L2-098)', () => {
  it('follows the offline and online events', () => {
    const status = TestBed.inject(OnlineStatus);
    expect(status.online()).toBe(navigator.onLine);
    window.dispatchEvent(new Event('offline'));
    expect(status.online()).toBe(false);
    window.dispatchEvent(new Event('online'));
    expect(status.online()).toBe(true);
  });
});
