// Unit test
// Traces to: L2-090 AC1
// Description: a place reads as the group board shows it.
import { ordinal } from './standings';

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [10, '10th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
  ])('reads %d as %s', (place, text) => {
    expect(ordinal(place)).toBe(text);
  });
});
