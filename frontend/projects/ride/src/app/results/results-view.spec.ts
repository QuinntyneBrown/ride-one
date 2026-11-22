import type { ClassResult, RaceResult, ResultStanding } from '@telo/api';
import { resultsView } from './results-view';

// Traces to: L2-073 AC1, AC2, AC3; L2-078 AC1; L2-079 AC1
// Results from the result the ride hands over: the header's context, the hidden heading, "You finished", the place or
// the time, "of 10", the line under it, the final standings and the again action. On the podium the line reads "{time}
// · on the podium"; off it, "{time} · {n} s off the podium", n the seconds behind 3rd.
describe('resultsView', () => {
  const rider = (name: string, finishTimeS: number, you = false): ResultStanding => ({
    name,
    jersey: you ? 'you' : name.split(' ')[1].toLowerCase(),
    bot: !you,
    you,
    finishTimeS,
  });
  const race = (
    place: number,
    standings: ResultStanding[],
    over: Partial<RaceResult> = {},
  ): RaceResult => ({
    mapId: 'old-town-criterium',
    mapName: 'Old Town Criterium',
    mode: 'bots',
    pack: 'medium',
    finishTimeS: standings[place - 1].finishTimeS,
    place,
    field: standings.length,
    standings,
    ...over,
  });

  it('reads 2nd of 10 against bots as a podium place, with the standings (AC1, AC3)', () => {
    const view = resultsView(
      race(2, [rider('Pacer Nova', 1592), rider('You', 1598, true), rider('Pacer Rook', 1607)], {
        field: 10,
      }),
    );

    expect(view).toEqual({
      context: 'Old Town Criterium · vs Bots',
      heading: 'Race results',
      lead: 'You finished',
      big: '2nd',
      podium: true,
      of: 'of 10',
      sub: '26:38 · on the podium',
      standings: [
        { place: 1, name: 'Pacer Nova', jersey: 'nova', bot: true, you: false, value: '26:32' },
        { place: 2, name: 'You', jersey: 'you', bot: false, you: true, value: '26:38' },
        { place: 3, name: 'Pacer Rook', jersey: 'rook', bot: true, you: false, value: '26:47' },
      ],
      again: {
        label: 'Race it again',
        path: '/race/old-town-criterium',
        query: { mode: 'bots', pack: 'medium' },
      },
    });
  });

  it('reads 6th of 10 as 18 s off the podium (AC2)', () => {
    const standings = [
      rider('Pacer Nova', 1622),
      rider('Pacer Rook', 1628),
      rider('Pacer Juno', 1634),
      rider('Pacer Atlas', 1640),
      rider('Pacer Kite', 1646),
      rider('You', 1652, true),
    ];
    const view = resultsView(race(6, standings, { field: 10 }));

    expect(view.big).toBe('6th');
    expect(view.podium).toBe(false);
    expect(view.sub).toBe('27:32 · 18 s off the podium');
  });

  it('reads a solo race as its time against your best, with no standings', () => {
    const view = resultsView(
      race(1, [rider('You', 57, true), rider('Ghost Best', 60)], { mode: 'solo', pack: null }),
    );

    expect(view).toEqual(
      expect.objectContaining({
        context: 'Old Town Criterium · vs your best',
        big: '0:57',
        podium: false,
        of: null,
        sub: null,
        standings: null,
        again: {
          label: 'Race it again',
          path: '/race/old-town-criterium',
          query: { mode: 'solo' },
        },
      }),
    );
  });

  it('reads a solo class as its time, output and share on target (L2-078 AC1)', () => {
    const result: ClassResult = {
      classId: 'hiit-cardio-30',
      title: '30 Minute HIIT Cardio',
      elapsedSeconds: 1800,
      outputKj: 341.6,
      onTargetShare: 0.838,
    };

    expect(resultsView(result)).toEqual({
      context: '30 Minute HIIT Cardio · Solo',
      heading: 'Class results',
      lead: 'You finished',
      big: '30:00',
      podium: false,
      of: null,
      sub: '342 kJ · 84% on target',
      standings: null,
      again: { label: 'Ride it again', path: '/classes/hiit-cardio-30', query: {} },
    });
  });

  it('writes an hour or more as h:mm:ss', () => {
    expect(resultsView(race(1, [rider('You', 3723, true)], { mode: 'solo', pack: null })).big).toBe(
      '1:02:03',
    );
  });
});
