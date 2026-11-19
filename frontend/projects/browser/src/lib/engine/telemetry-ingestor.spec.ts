// Unit Test
// Traces to: L2-005, L2-006, L2-007, L2-049, L2-092
// Description: Mirrors backend/tests/Wattzup.Core.Tests/TelemetryIngestorTests.cs: every frame
// counts; decoded frames set metrics, power and timestamps; a resistance report acknowledges.
import { TestBed } from '@angular/core/testing';
import { CLOCK } from '../bluetooth/clock';
import { FakeClock } from '../bluetooth/fake-clock';
import { BikeStateStore } from './bike-state-store';
import { add } from './command-log';
import { TelemetryIngestor } from './telemetry-ingestor';

const hex = (text: string): Uint8Array =>
  Uint8Array.from(text.split(' ').map((b) => parseInt(b, 16)));

function setUp() {
  const clock = new FakeClock(1_794_784_639_021);
  TestBed.configureTestingModule({
    providers: [BikeStateStore, TelemetryIngestor, { provide: CLOCK, useValue: clock }],
  });
  return {
    clock,
    store: TestBed.inject(BikeStateStore),
    ingestor: TestBed.inject(TelemetryIngestor),
  };
}

describe('TelemetryIngestor', () => {
  it('an ignored frame still counts and changes no metric', () => {
    const { store, ingestor } = setUp();
    ingestor.onNotify(hex('F0 D0 01 01 C2'));
    expect(store.state().packets).toBe(1);
    expect(store.state().last_data_at).toBeNull();
  });

  it('a resistance frame sets resistance, timestamps and power with the known cadence', async () => {
    const { clock, store, ingestor } = setUp();
    ingestor.onNotify(hex('F0 D1 09 00 05 00 00 00 00 00 5F 00 1F'));
    await clock.advance(2000);
    ingestor.onNotify(hex('F0 D2 01 12 D5'));
    expect(store.state()).toMatchObject({
      packets: 2,
      resistance: 18,
      cadence: 95,
      power: 317,
      first_data_at: 1_794_784_639.021,
      last_data_at: 1_794_784_641.021,
    });
  });

  it('a resistance report acknowledges the pending command', async () => {
    const { clock, store, ingestor } = setUp();
    store.update((s) => ({
      ...s,
      commands: add(s.commands, {
        at: 1_794_784_639.021,
        ride_seconds: null,
        level: 18,
        source: 'manual',
        status: 'sending',
        ack_ms: null,
      }),
    }));
    await clock.advance(38);
    ingestor.onNotify(hex('F0 D2 01 12 D5'));
    expect(store.state().commands[0]).toMatchObject({ status: 'ack', ack_ms: 38 });
  });
});
