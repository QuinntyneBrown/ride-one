// Unit test (the slice's acceptance table: the ride screens that show resistance come with journeys 5, 7 and 21)
// Traces to: L2-025 AC2, AC4; L2-026 AC1; L2-027 AC1, AC4; L2-028 AC4
// Description: a plan's level becomes the target resistance, clamped to 1 to 32 and sent, with its acknowledgement
// time kept; the bike's reported resistance stays apart from the target; with the bike away or refusing control the
// controller cannot control it, and the connection keeps the target for the reconnect. A fake connection stands in
// for the bike, and the simulated bike runs the path end to end.
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import {
  BIKE_CONNECTION,
  BikeConnectionError,
  type BikeConnection,
  type BleState,
  TICKER,
} from '@telo/api';
import { Subject } from 'rxjs';
import { SimulatedBikeConnection } from '../bluetooth/simulated-bike-connection';
import { BikeTelemetry } from './bike-telemetry';
import { ResistanceController } from './resistance-controller';

describe('ResistanceController', () => {
  const ble = signal<BleState>('connected');
  let setResistance: ReturnType<typeof vi.fn<(level: number) => Promise<number>>>;
  let controller: ResistanceController;

  beforeEach(() => {
    ble.set('connected');
    setResistance = vi.fn(async () => 34);
    const connection: Partial<BikeConnection> = { ble, setResistance };
    TestBed.configureTestingModule({
      providers: [ResistanceController, { provide: BIKE_CONNECTION, useValue: connection }],
    });
    controller = TestBed.inject(ResistanceController);
  });

  it('sends a plan’s level as the target resistance, and keeps its acknowledgement time (L2-027 AC1, L2-025 AC4)', async () => {
    await controller.applyPlanLevel(12);

    expect(setResistance).toHaveBeenCalledWith(12);
    expect(controller.target()).toBe(12);
    expect(controller.source()).toBe('plan');
    expect(controller.last()).toEqual({ rideTime: null, level: 12, source: 'plan', ackMs: 34 });
  });

  it.each([
    [40, 32],
    [33, 32],
    [0, 1],
    [-3, 1],
    [12.6, 13],
  ])('clamps a target of %d to %d before it is sent (L2-025 AC2)', async (level, sent) => {
    await controller.applyPlanLevel(level);

    expect(setResistance).toHaveBeenCalledWith(sent);
    expect(controller.target()).toBe(sent);
  });

  it('can control a connected bike', () => {
    expect(controller.canControl()).toBe(true);
  });

  it('cannot control a bike that is away, but asks the connection, which keeps the target for the reconnect (L2-027 AC4, L2-028 AC4)', async () => {
    ble.set('disconnected');
    setResistance.mockRejectedValue(new BikeConnectionError('failed', 'The bike is not connected'));

    await controller.applyPlanLevel(10);

    expect(controller.canControl()).toBe(false);
    expect(setResistance).toHaveBeenCalledWith(10);
    expect(controller.target()).toBe(10);
    expect(controller.last()).toBeNull();
  });

  it('stops controlling an FTMS bike once it refuses control (L2-028 AC4)', async () => {
    setResistance.mockRejectedValue(
      new BikeConnectionError('read-only', 'The bike does not give control'),
    );

    await controller.applyPlanLevel(10);

    expect(controller.canControl()).toBe(false);
    expect(controller.last()).toBeNull();
  });
});

describe('ResistanceController on the simulated bike', () => {
  it('the bike follows the target and reports it back as its resistance, kept apart from the target (L2-026 AC1)', async () => {
    const second = new Subject<number>();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ResistanceController,
        BikeTelemetry,
        SimulatedBikeConnection,
        { provide: BIKE_CONNECTION, useExisting: SimulatedBikeConnection },
        { provide: TICKER, useValue: { seconds: second } },
      ],
    });
    const bike = TestBed.inject(SimulatedBikeConnection);
    const telemetry = TestBed.inject(BikeTelemetry);
    const controller = TestBed.inject(ResistanceController);
    await bike.requestBike();
    await bike.connect();

    await controller.applyPlanLevel(14);
    second.next(0);

    expect(telemetry.resistance()).toBe(14);
    expect(controller.target()).toBe(14);
    expect(controller.last()).toEqual({ rideTime: null, level: 14, source: 'plan', ackMs: 0 });
    TestBed.resetTestingModule();
  });
});
