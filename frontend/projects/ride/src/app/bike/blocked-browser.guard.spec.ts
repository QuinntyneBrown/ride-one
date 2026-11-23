// Unit test
// Traces to: L2-010 AC2
// Description: the guard on the class ride's address sends a blocked browser to The Class and lets every other
// browser through, one case per support state. It reads the support state and nothing else.
import { TestBed } from '@angular/core/testing';
import {
  type ActivatedRouteSnapshot,
  Router,
  type RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { BLUETOOTH_SUPPORT, type BluetoothSupportState } from '@telo/api';
import { blockedBrowserGuard } from './blocked-browser.guard';

describe('blockedBrowserGuard', () => {
  const open = (state: BluetoothSupportState) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        // Only the state: reading again or asking for the secure address would be a member that is not there.
        { provide: BLUETOOTH_SUPPORT, useValue: { state: () => state } },
      ],
    });
    const answer = TestBed.runInInjectionContext(() =>
      blockedBrowserGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    return answer instanceof UrlTree ? TestBed.inject(Router).serializeUrl(answer) : answer;
  };

  it.each<[BluetoothSupportState, string | boolean]>([
    ['ready', true],
    ['adapter-off', true],
    ['unsupported-browser', '/'],
    ['insecure-context', '/'],
  ])('%s: %s', (state, opens) => {
    expect(open(state)).toBe(opens);
  });
});
