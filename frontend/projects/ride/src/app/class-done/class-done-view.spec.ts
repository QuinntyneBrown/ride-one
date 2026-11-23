// Unit test
// Traces to: L2-078 AC2, AC3, AC4
// Description: Class Done's output is the ride's output in whole kJ, its time the running time, and its average
// watts round(output in kJ × 1000 ÷ running seconds).
import type { ClassResult } from '@telo/api';
import { classDoneView } from './class-done-view';

const ride = (outputKj: number, elapsedSeconds: number): ClassResult => ({
  classId: 'intervals-to-the-beat',
  title: 'Intervals to the Beat',
  elapsedSeconds,
  outputKj,
  onTargetShare: 0.84,
});

describe('classDoneView', () => {
  it('shows the output in whole kJ, the time and the average watts (L2-078 AC2)', () => {
    expect(classDoneView(ride(351, 1200))).toEqual({
      title: 'Intervals to the Beat',
      output: '351',
      time: '20:00',
      average: '293',
      announcement: 'Class done: 351 kJ in 20:00.',
    });
  });

  it('rounds the output to a whole kJ (L2-078 AC4)', () => {
    expect(classDoneView(ride(341.6, 1200)).output).toBe('342');
    expect(classDoneView(ride(341.4, 1200)).output).toBe('341');
  });

  it('averages from the unrounded output over the running seconds (L2-078 AC3)', () => {
    // 341.6 kJ over 1,200 s is 284.67 W; 5.2 kJ over 12 s is 433.3 W.
    expect(classDoneView(ride(341.6, 1200)).average).toBe('285');
    expect(classDoneView(ride(5.2, 12)).average).toBe('433');
  });

  it('is 0 W for a ride of no seconds, and shows an hour as 1:02:03', () => {
    expect(classDoneView(ride(0, 0)).average).toBe('0');
    expect(classDoneView(ride(10, 3723)).time).toBe('1:02:03');
  });
});
