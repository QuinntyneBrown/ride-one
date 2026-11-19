// Unit Test
// Traces to: L2-089
// Description: BrowserBikePairing reports the page's Bluetooth support and keeps `adapter` in step
// with getAvailability() and availabilitychanged; an unsupported page asks Bluetooth nothing.
import { PacketLog } from '../bluetooth/packet-log';
import { TestBed } from '@angular/core/testing';
import type { BluetoothSupport } from '@wattzup/api';
import { BikeLink } from '../bluetooth/bike-link';
import { BLUETOOTH_PORT, type BluetoothPort } from '../bluetooth/bluetooth-port';
import { BikeStateStore } from '../engine/bike-state-store';
import { TelemetryIngestor } from '../engine/telemetry-ingestor';
import { BrowserBikePairing } from './browser-bike-pairing';

class FakePort implements BluetoothPort {
  available = true;
  asked = 0;
  private listener: ((available: boolean) => void) | null = null;
  constructor(private readonly verdict: BluetoothSupport) {}
  support = () => this.verdict;
  availability = async () => {
    this.asked++;
    return this.available;
  };
  onAvailabilityChanged = (listener: (available: boolean) => void) => {
    this.listener = listener;
  };
  requestBike = async () => null;
  change(available: boolean): void {
    this.available = available;
    this.listener?.(available);
  }
}

function setup(verdict: BluetoothSupport, available = true) {
  const port = new FakePort(verdict);
  port.available = available;
  TestBed.configureTestingModule({
    providers: [
      BrowserBikePairing,
      BikeLink,
      PacketLog,
      BikeStateStore,
      TelemetryIngestor,
      { provide: BLUETOOTH_PORT, useValue: port },
    ],
  });
  return {
    port,
    pairing: TestBed.inject(BrowserBikePairing),
    adapter: () => TestBed.inject(BikeStateStore).state().adapter,
  };
}

describe('BrowserBikePairing', () => {
  it('reports the verdict and, when ready, sets the adapter from getAvailability', async () => {
    const { pairing, adapter } = setup('ready', false);
    await pairing.checkAgain();
    expect(pairing.support()).toBe('ready');
    expect(adapter()).toBe('off');
  });

  it('follows availabilitychanged', async () => {
    const { pairing, port, adapter } = setup('ready', false);
    await pairing.checkAgain();
    port.change(true);
    expect(adapter()).toBe('on');
  });

  it('Check again asks the browser once more', async () => {
    const { pairing, port, adapter } = setup('ready', false);
    await pairing.checkAgain();
    port.available = true;
    await pairing.checkAgain();
    expect(adapter()).toBe('on');
    expect(port.asked).toBeGreaterThanOrEqual(2);
  });

  it.each(['unsupported', 'insecure'] as const)(
    'on an %s page asks Bluetooth nothing',
    async (verdict) => {
      const { pairing, port, adapter } = setup(verdict);
      await pairing.checkAgain();
      expect(pairing.support()).toBe(verdict);
      expect(port.asked).toBe(0);
      expect(adapter()).toBe('unknown');
    },
  );
});
