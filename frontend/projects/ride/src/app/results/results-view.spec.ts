import type { ClassResult } from '@telo/api';
import { resultsView } from './results-view';

// Traces to: L2-078 AC1; L2-079 AC1
// Results from the result the class hands over: the header's context, the hidden heading, "You finished", the time,
// the line under it and the again action. Nothing is earned (ADR 0039).
describe('resultsView', () => {
  const hiit: ClassResult = {
    classId: 'hiit-cardio-30',
    title: '30 Minute HIIT Cardio',
    elapsedSeconds: 1800,
    outputKj: 341.6,
    onTargetShare: 0.838,
  };

  it('reads a solo class as its time, output and share on target (L2-078 AC1)', () => {
    expect(resultsView(hiit)).toEqual({
      context: '30 Minute HIIT Cardio · Solo',
      heading: 'Class results',
      lead: 'You finished',
      big: '30:00',
      podium: false,
      of: null,
      sub: '342 kJ · 84% on target',
      announcement: 'Class results: You finished 30:00.',
      again: 'Ride it again',
    });
  });

  it('writes an hour or more as h:mm:ss', () => {
    expect(resultsView({ ...hiit, elapsedSeconds: 3723 }).big).toBe('1:02:03');
  });
});
