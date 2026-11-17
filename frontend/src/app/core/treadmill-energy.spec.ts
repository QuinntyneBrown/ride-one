import { kcalPerSecond } from './treadmill-energy';

// The rows of TreadmillEnergyTests in Wattzup.Core.Tests (L2-064 AC11).
describe('kcalPerSecond (L2-064 AC11)', () => {
  it.each([
    [13.0, 2, 0.3171],
    [6.5, 0, 0.1573],
    [6.4, 0, 0.0885],
    [6.4, 10, 0.2085],
    [0.0, 0, 0.0219],
  ])('%d km/h at %d%% spends %d kcal a second', (speed, incline, kcal) => {
    expect(kcalPerSecond(speed, incline)).toBeCloseTo(kcal, 4);
  });
});
