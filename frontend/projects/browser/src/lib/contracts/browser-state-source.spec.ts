import { TestBed } from '@angular/core/testing';
import { BikeStateStore } from '../engine/bike-state-store';
import { BrowserStateSource } from './browser-state-source';

function source(): BrowserStateSource {
  TestBed.configureTestingModule({ providers: [BrowserStateSource, BikeStateStore] });
  return TestBed.inject(BrowserStateSource);
}

describe('BrowserStateSource', () => {
  it('has no state until started', () => {
    expect(source().state()).toBeNull();
  });

  it('starts with no bike chosen: ble disconnected and nothing measured (L2-090 AC1)', () => {
    const s = source();
    s.ensureStarted();
    expect(s.state()).toMatchObject({
      ble: 'disconnected',
      device: null,
      resistance: null,
      cadence: null,
      workout: null,
      packets: 0,
    });
  });
});

describe('BrowserStateSource, once started', () => {
  it('follows every change to the store', () => {
    TestBed.configureTestingModule({ providers: [BrowserStateSource, BikeStateStore] });
    const s = TestBed.inject(BrowserStateSource);
    s.ensureStarted();
    TestBed.inject(BikeStateStore).update((b) => ({ ...b, ble: 'connecting', device: 'ECHEX-3' }));
    expect(s.state()).toMatchObject({
      ble: 'connecting',
      device: 'ECHEX-3',
      device_label: 'ECHEX-3',
    });
  });
});
