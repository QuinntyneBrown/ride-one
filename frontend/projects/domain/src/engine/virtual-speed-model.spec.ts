// Unit test
// Traces to: L2-059 AC3
// Description: the virtual speed from power is main's 10 × ∛(W ÷ 20) km/h, with power taken as at least 1 W.
import { VirtualSpeedModel } from './virtual-speed-model';

describe('VirtualSpeedModel', () => {
  it.each([
    [371, 26.47],
    [418, 27.545],
    [160, 20],
    [20, 10],
    [0, 3.684],
    [-5, 3.684],
  ])('%d W rides at %d km/h', (watts, kmh) => {
    expect(VirtualSpeedModel.speedKmh(watts)).toBeCloseTo(kmh, 2);
  });

  it('gives the same speed in metres a second', () => {
    expect(VirtualSpeedModel.speedMs(160)).toBeCloseTo(20 / 3.6, 6);
  });
});
