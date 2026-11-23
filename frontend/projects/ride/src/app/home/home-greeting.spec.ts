// Unit test
// Traces to: L2-033 AC1; ADR 0039
// Description: Home's heading greets the rider by the time of day, without a name: "Morning." before 12:00,
// "Afternoon." from 12:00 to 16:59, "Evening." from 17:00.
import { homeGreeting } from './home-greeting';

describe('homeGreeting', () => {
  it.each([
    [0, 'Morning.'],
    [11, 'Morning.'],
    [12, 'Afternoon.'],
    [16, 'Afternoon.'],
    [17, 'Evening.'],
    [19, 'Evening.'],
    [23, 'Evening.'],
  ])('at %d:00 reads %s', (hour, reads) => {
    expect(homeGreeting(hour)).toBe(reads);
  });
});
