import type { ClassResult, RideRecordedDto, RideSyncState } from '@telo/api';
import { resultsView } from './results-view';

// Traces to: L2-078 AC1; L2-079 AC1; L2-074 AC1-AC4
// Results from the result the class hands over: the header's context, the hidden heading, "You finished", the time,
// the line under it, the again action and what the ride earned.
const SENDING: RideSyncState = { kind: 'sending' };
const WAITING = { state: 'waiting', total: null, lines: [] };

describe('resultsView', () => {
  const hiit: ClassResult = {
    classId: 'hiit-cardio-30',
    title: '30 Minute HIIT Cardio',
    elapsedSeconds: 1800,
    outputKj: 341.6,
    onTargetShare: 0.838,
  };

  it('reads a solo class as its time, output and share on target (L2-078 AC1)', () => {
    expect(resultsView(hiit, SENDING)).toEqual({
      context: '30 Minute HIIT Cardio · Solo',
      heading: 'Class results',
      lead: 'You finished',
      big: '30:00',
      podium: false,
      of: null,
      sub: '342 kJ · 84% on target',
      announcement: 'Class results: You finished 30:00.',
      again: { label: 'Ride it again', path: '/classes/hiit-cardio-30', query: {} },
      xp: WAITING,
    });
  });

  it('writes an hour or more as h:mm:ss', () => {
    expect(resultsView({ ...hiit, elapsedSeconds: 3723 }, SENDING).big).toBe('1:02:03');
  });

  describe('what the ride earned', () => {
    const recorded: RideSyncState = {
      kind: 'recorded',
      answer: {
        rideId: 'r',
        recordedAt: '2026-11-21T07:31:00Z',
        xpLines: [
          { kind: 'finished', label: 'Finished', xp: 100 },
          { kind: 'onTarget', label: '84% on target', xp: 67 },
        ],
        xpTotal: 167,
        totalXp: 2282,
        level: 7,
        levelUp: false,
        nextLevelXp: 2600,
        xpToNextLevel: 318,
        stars: null,
        best: null,
        openedMapId: null,
      } as RideRecordedDto,
    };

    it('shows the total and each line in the order returned (L2-074 AC1)', () => {
      const view = resultsView(hiit, recorded);

      expect(view.announcement).toBe('Class results: You finished 30:00. +167 XP earned.');
      expect(view.xp).toEqual({
        state: 'ready',
        total: '+167',
        lines: [
          { label: 'Finished', xp: '+100' },
          { label: '84% on target', xp: '+67' },
        ],
      });
    });

    it('waits, waits offline or has not been recorded (L2-074 AC2, AC3, AC4)', () => {
      expect(
        [
          resultsView(hiit, SENDING),
          resultsView(hiit, { kind: 'waitingOffline' }),
          resultsView(hiit, { kind: 'notRecorded' }),
        ].map((view) => view.xp.state),
      ).toEqual(['waiting', 'offline', 'notRecorded']);
    });
  });
});
