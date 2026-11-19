// Unit Test
// Traces to: L2-099
// Description: The development simulator answers Connect bike without a chooser and behaves as
// SimulatedBikeConnection: a 0xD1 workout frame each second, a 0xD2 echo for each resistance write.
import { decode } from '../protocol/packet-decoder';
import { setResistance } from '../protocol/echelon-commands';
import { FakeClock } from './fake-clock';
import {
  SIMULATED_BIKE_NAME,
  SimulatedBluetoothPort,
  simulateRequested,
} from './simulated-bluetooth-port';

async function connected() {
  const clock = new FakeClock();
  const port = new SimulatedBluetoothPort(clock);
  const bike = (await port.requestBike())!;
  const link = await bike.connect();
  const frames: Uint8Array[] = [];
  await link.startNotifications((f) => frames.push(f));
  return { clock, bike, link, frames };
}

describe('SimulatedBluetoothPort', () => {
  it('answers the simulated bike at once, with no chooser', async () => {
    const bike = await new SimulatedBluetoothPort(new FakeClock()).requestBike();
    expect(bike?.name).toBe(SIMULATED_BIKE_NAME);
  });

  it('sends a workout frame each second with the simulated cadence', async () => {
    const { clock, frames } = await connected();
    await clock.advance(3000);
    expect(frames).toHaveLength(3);
    expect(frames.map((f) => decode(f))).toEqual(
      Array(3).fill(expect.objectContaining({ kind: 'cadence', rpm: 85 })),
    );
  });

  it('echoes each resistance write as a resistance frame', async () => {
    const { link, frames } = await connected();
    await link.write(setResistance(14));
    expect(decode(frames.at(-1)!)).toEqual({ kind: 'resistance', level: 14 });
  });

  it('stops sending once disconnected', async () => {
    const { clock, link, frames } = await connected();
    link.disconnect();
    await clock.advance(3000);
    expect(frames).toEqual([]);
  });
});

describe('simulateRequested', () => {
  it.each([
    [true, '?simulate', true],
    [true, '?simulate=1', true],
    [true, '?a=b&simulate', true],
    [true, '', false],
    [true, '?simulated', false],
    [false, '?simulate', false],
  ])('dev mode %s with "%s" simulates: %s', (devMode, search, expected) => {
    expect(simulateRequested(devMode, search)).toBe(expected);
  });
});
