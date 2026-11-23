// Unit test
// Traces to: L2-084 AC1, AC4, AC6, AC7; L2-173 AC1, AC3, AC5, AC6
// Description: The Class's view. The start button reads "Start class" and opens the ride with a connected bike, and
// "Connect your bike" with its line, opening Connect Bike, without one, whichever way the class is ridden. "Ride with"
// offers the class video and Ibiza Sunset Strip, which says how far and how high it is, or why it cannot be chosen.
// The class's words come from its definition, and the course's still stands in when the ride is in Ibiza.
import { INTERVALS_TO_THE_BEAT } from '@telo/domain';
import { rideWithOptions, startAction, theClassView } from './the-class-view';

const state = {
  definition: INTERVALS_TO_THE_BEAT,
  connected: true,
  rideWith: 'video',
  drawable: true,
  videoUnavailable: false,
} as const;

describe('startAction', () => {
  it.each([
    { connected: true, label: 'Start class', hint: null, opens: 'ride' },
    {
      connected: false,
      label: 'Connect your bike',
      hint: 'The class needs the bike to set resistance.',
      opens: 'connect',
    },
  ] as const)('connected $connected: "$label" opens $opens', ({ connected, ...action }) => {
    expect(startAction(connected)).toEqual(action);
  });

  it.each(['video', 'ibiza'] as const)('reads the same when the ride is with %s', (rideWith) => {
    expect(theClassView({ ...state, rideWith }).start).toEqual(startAction(true));
    expect(theClassView({ ...state, rideWith, connected: false }).start).toEqual(
      startAction(false),
    );
  });
});

describe('rideWithOptions', () => {
  it('offers the class video and Ibiza Sunset Strip with its length and climb', () => {
    expect(rideWithOptions(true)).toEqual([
      { way: 'video', name: 'Class video', detail: null, disabled: false },
      {
        way: 'ibiza',
        name: 'Ibiza Sunset Strip',
        detail: '8.4 km · 159 m of climbing',
        disabled: false,
      },
    ]);
  });

  it('disables Ibiza and says why where the browser cannot draw it', () => {
    expect(rideWithOptions(false)[1]).toEqual({
      way: 'ibiza',
      name: 'Ibiza Sunset Strip',
      detail: 'This browser can’t draw Ibiza.',
      disabled: true,
    });
    expect(rideWithOptions(false)[0].disabled).toBe(false);
  });
});

describe('theClassView', () => {
  it('reads the class’s words and its length from its definition', () => {
    expect(theClassView(state)).toMatchObject({
      meta: 'GCN Training · Intervals',
      title: 'Intervals to the Beat',
      summary:
        'Seventeen efforts from 15 seconds to 1:15, ridden to the beat, with five fast sprints to finish.',
      length: '20:00',
      lengthLabel: 'start to finish',
      cover: {
        url: 'https://i.ytimg.com/vi/il_OFz6o42I/hqdefault.jpg',
        alt: 'Video: Intervals to the Beat, GCN Training',
      },
    });
  });

  it('has no still with the class video, and the course’s still in Ibiza', () => {
    expect(theClassView(state).still).toBeNull();
    expect(theClassView({ ...state, rideWith: 'ibiza' }).still).toEqual({
      url: 'maps/ibiza-sunset-strip-photo.jpg',
      alt: 'Ibiza Sunset Strip: a seafront road at sunset',
    });
  });

  it('says when the video cannot load', () => {
    expect(theClassView(state).videoUnavailable).toBe(false);
    expect(theClassView({ ...state, videoUnavailable: true }).videoUnavailable).toBe(true);
  });
});
