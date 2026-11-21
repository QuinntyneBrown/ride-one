/** A plan's segment as the backend sends it. */
interface Segment {
  kind: 'warm-up' | 'work' | 'recover' | 'steady' | 'cool-down';
  duration: number;
  level: number;
  cadenceAim: number;
}

const work: Segment = { kind: 'work', duration: 30, level: 18, cadenceAim: 100 };
const recover = (duration: number): Segment => ({
  kind: 'recover',
  duration,
  level: 6,
  cadenceAim: 72,
});

/**
 * 30 Minute HIIT Cardio as the catalogue serves it (L2-080): eight 30-second efforts with a recovery that shrinks each
 * round, between a 5-minute warm-up and a 6-minute cool-down, as the mock's plan profile draws it.
 */
export const hiitCardio = {
  id: 'hiit-cardio-30',
  title: '30 Minute HIIT Cardio',
  channel: 'GCN Training',
  focus: 'HIIT',
  lengthSeconds: 1800,
  opensAtLevel: 1,
  shelfId: '30-min',
  summary: 'Eight 30-second maximal efforts with a recovery that shrinks each round. The classic.',
  world: 'oldtown',
  video: { videoId: 'QUoToFsMNig', syncOffsetSeconds: 12 },
  plan: {
    segments: [
      { kind: 'warm-up', duration: 300, level: 8, cadenceAim: 80 },
      ...[180, 150, 150, 120, 120, 90, 90].flatMap((rest) => [work, recover(rest)]),
      work,
      { kind: 'cool-down', duration: 360, level: 6, cadenceAim: 70 },
    ] satisfies Segment[],
  },
};

/** The catalogue as `GET /api/classes` answers it: the 30-minute shelf with 30 Minute HIIT Cardio on it. */
export const catalogue = {
  shelves: [
    { id: '30-min', title: '30 min', tagline: 'Structured intervals with a proper warm-up.' },
  ],
  classes: [hiitCardio],
};
