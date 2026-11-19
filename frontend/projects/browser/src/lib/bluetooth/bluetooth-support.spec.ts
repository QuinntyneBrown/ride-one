// Unit Test
// Traces to: L2-089
// Description: One case per row of the support table in check-browser-support.
import { supportVerdict } from './bluetooth-support';

describe('supportVerdict', () => {
  it.each([
    [false, false, 'insecure'],
    [false, true, 'insecure'],
    [true, false, 'unsupported'],
    [true, true, 'ready'],
  ] as const)('secure %s, Web Bluetooth %s: %s', (isSecureContext, hasBluetooth, verdict) => {
    expect(supportVerdict({ isSecureContext, hasBluetooth })).toBe(verdict);
  });
});
