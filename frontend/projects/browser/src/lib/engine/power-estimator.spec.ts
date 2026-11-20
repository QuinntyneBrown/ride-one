// Unit Test
// Traces to: L2-049, L2-092
// Description: The power estimator, one case per table row.
import { estimateWatts } from './power-estimator';

describe('PowerEstimator', () => {
  it.each<[number | null, number | null, number | null]>([
    [95, 18, 317],
    [98, 18, 327],
    [null, 18, null],
    [95, null, null],
    [0, 18, 0],
  ])('estimates %s rpm at level %s as %s W', (cadence, level, watts) => {
    expect(estimateWatts(cadence, level)).toBe(watts);
  });
});
