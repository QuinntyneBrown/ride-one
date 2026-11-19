import { BrowserStateSource } from './browser-state-source';

describe('BrowserStateSource', () => {
  it('has no state until started', () => {
    expect(new BrowserStateSource().state()).toBeNull();
  });

  it('starts with no bike chosen: ble disconnected and nothing measured (L2-090 AC1)', () => {
    const source = new BrowserStateSource();
    source.ensureStarted();
    expect(source.state()).toMatchObject({
      ble: 'disconnected',
      device: null,
      resistance: null,
      cadence: null,
      workout: null,
      packets: 0,
    });
    expect(source.connection()).toBe('open');
  });
});
