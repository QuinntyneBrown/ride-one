// Unit Test
// Traces to: L2-077, L2-092, L2-096
// Description: The class catalogue reader, one case per table row.
import { LEVEL_RANGE } from './workout-plan-validator';
import { MAX_BYTES, readCatalogue } from './class-catalogue-reader';

type Json = Record<string, unknown>;
const FLAT_PLAN = '{"kind":"flat","level":12,"minutes":30,"cadence":85}';
const shelf = (id = 'short'): Json => ({ id, title: '20 min', tagline: 'Short and sharp.' });
const cls = (id = 'steady'): Json => ({
  id,
  title: 'Steady',
  channel: 'Wattzup Studio',
  focus: 'Zone 2',
  description: 'One level.',
  shelf: 'short',
  plan: JSON.parse(FLAT_PLAN),
});
const read = (shelves: Json[], classes: Json[]) =>
  readCatalogue(JSON.stringify({ shelves, classes }));
function readOneClass(field: string, value: unknown) {
  const entry = cls();
  if (value === undefined) delete entry[field];
  else entry[field] = value;
  return read([shelf()], [entry]);
}

describe('ClassCatalogueReader', () => {
  it('a valid catalogue keeps every shelf and class in file order', () => {
    const r = read(
      [shelf('a'), shelf('b')],
      [
        { ...cls('x'), shelf: 'b' },
        { ...cls('y'), shelf: 'a' },
      ],
    );
    expect(r.fileError).toBeNull();
    expect(r.problems).toEqual([]);
    expect(r.catalogue!.shelves.map((s) => s.id)).toEqual(['a', 'b']);
    expect(r.catalogue!.classes.map((c) => c.id)).toEqual(['x', 'y']);
    expect(r.catalogue!.classes[0].plan.kind).toBe('flat');
  });

  it.each([
    ['id', 'a', true],
    ['id', 'abc-123', true],
    ['id', '', false],
    ['id', 'Upper', false],
    ['id', 'has space', false],
    ['id', '../x', false],
    ['title', '', false],
    ['channel', '', false],
    ['focus', '', false],
    ['description', '', true],
    ['shelf', 'nowhere', false],
  ])('a class field is checked against its rule: %s = "%s"', (field, value, kept) => {
    const r = readOneClass(field, value);
    expect(r.catalogue!.classes).toHaveLength(kept ? 1 : 0);
    if (!kept) {
      expect(r.problems).toHaveLength(1);
      expect(r.problems[0].field).toBe(field);
      expect(r.problems[0].entry).toBe(field === 'id' ? 'classes[0]' : 'steady');
    }
  });

  it.each([
    ['id', 64, true],
    ['id', 65, false],
    ['title', 80, true],
    ['title', 81, false],
    ['channel', 40, true],
    ['channel', 41, false],
    ['focus', 40, true],
    ['focus', 41, false],
    ['description', 280, true],
    ['description', 281, false],
  ])('a class %s of %i characters is kept: %s', (field, length, kept) => {
    expect(readOneClass(field, 'a'.repeat(length)).catalogue!.classes).toHaveLength(kept ? 1 : 0);
  });

  it('characters are counted as characters, not bytes', () => {
    expect(readOneClass('focus', '₂'.repeat(40)).catalogue!.classes).toHaveLength(1);
  });

  it.each(['title', 'channel', 'focus', 'description', 'shelf', 'plan'])(
    'a class missing %s is left out',
    (field) => {
      const r = readOneClass(field, undefined);
      expect(r.catalogue!.classes).toEqual([]);
      expect(r.problems.map((p) => p.field)).toEqual([field]);
    },
  );

  it('a class whose text field is not a string is left out', () => {
    expect(readOneClass('title', 7).catalogue!.classes).toEqual([]);
  });

  it('a class with an invalid plan is left out, naming the plan field', () => {
    const r = readOneClass('plan', { kind: 'flat', level: 40, minutes: 30, cadence: 85 });
    expect(r.catalogue!.classes).toEqual([]);
    expect(r.problems).toEqual([{ entry: 'steady', field: 'plan.level', message: LEVEL_RANGE }]);
  });

  it('a class whose plan has no level is left out', () => {
    const r = readOneClass('plan', { kind: 'flat', speed: 9.0, incline: 2, minutes: 30 });
    expect(r.catalogue!.classes).toEqual([]);
    expect(r.problems[0].field.startsWith('plan')).toBe(true);
  });

  it('a plan video keeps only its id and start point', () => {
    const plan = {
      ...JSON.parse(FLAT_PLAN),
      video: { url: 'https://youtu.be/QUoToFsMNig', start_seconds: 12.5 },
    };
    expect(readOneClass('plan', plan).catalogue!.classes[0].plan.video).toEqual({
      video_id: 'QUoToFsMNig',
      start_seconds: 12.5,
    });
  });

  it('a repeated class id leaves out the later class', () => {
    const r = read([shelf()], [cls(), { ...cls(), title: 'Second' }]);
    expect(r.catalogue!.classes.map((c) => c.title)).toEqual(['Steady']);
    expect(r.problems.map((p) => [p.entry, p.field])).toEqual([['steady', 'id']]);
  });

  it.each([
    ['id', 'Bad Id'],
    ['id', ''],
    ['title', ''],
  ])('a shelf breaking its %s rule is left out with its classes', (field, value) => {
    const r = read([{ ...shelf(), [field]: value }], [cls()]);
    expect(r.catalogue!.shelves).toEqual([]);
    expect(r.catalogue!.classes).toEqual([]);
    expect(r.problems.some((p) => p.field === field)).toBe(true);
  });

  it('a shelf tagline over 280 characters leaves the shelf out', () => {
    expect(read([{ ...shelf(), tagline: 'a'.repeat(281) }], []).catalogue!.shelves).toEqual([]);
  });

  it('a repeated shelf id leaves out the later shelf', () => {
    const r = read([shelf(), { ...shelf(), title: 'Second' }], [cls()]);
    expect(r.catalogue!.shelves.map((s) => s.title)).toEqual(['20 min']);
    expect(r.catalogue!.classes).toHaveLength(1);
    expect(r.problems.map((p) => [p.entry, p.field])).toEqual([['short', 'id']]);
  });

  it('beyond 20 shelves the first 20 are kept and one problem names how many were dropped', () => {
    const r = read(
      Array.from({ length: 21 }, (_, i) => shelf(`s${i}`)),
      [],
    );
    expect(r.catalogue!.shelves).toHaveLength(20);
    expect(r.problems).toHaveLength(1);
    expect(r.problems[0].message).toContain('1');
  });

  it('beyond 200 valid classes the first 200 are kept and one problem names how many were dropped', () => {
    const classes = Array.from({ length: 202 }, (_, i) => cls(`c${i}`));
    classes[0]['title'] = '';
    const r = read([shelf()], classes);
    expect(r.catalogue!.classes).toHaveLength(200);
    expect(r.catalogue!.classes[0].id).toBe('c1');
    expect(r.problems).toHaveLength(2);
    expect(r.problems[1].message).toContain('1');
  });

  it('a file over 1 MB is not read', () => {
    const r = readCatalogue('{"shelves":[],"classes":[]}', MAX_BYTES + 1);
    expect(r.catalogue).toBeNull();
    expect(r.fileError).toBe('larger than 1 MB');
  });

  it.each(['{not json', '', '[]', '{"shelves":{},"classes":[]}'])(
    'a file that is not a catalogue gives none: %s',
    (json) => {
      const r = readCatalogue(json);
      expect(r.catalogue).toBeNull();
      expect(r.fileError).not.toBeNull();
    },
  );

  it('a catalogue with no shelves or classes is empty but valid', () => {
    const r = readCatalogue('{"shelves":[],"classes":[]}');
    expect(r.fileError).toBeNull();
    expect(r.catalogue!.shelves).toEqual([]);
  });

  it.each([
    'docklands',
    'granite',
    'oldtown',
    'prairie',
    'dolomites',
    'coast',
    'caribana',
    'westminster',
    'centralpark',
    'southbeach',
    'ghent',
    'blackpool',
    'suburbia',
    'nottinghill',
    'knicks',
    'vegas',
    'route66',
    'venice',
    'amsterdam',
    'giza',
    'daytona',
    'koppenberg',
    'ventoux',
    'chicago',
    'goldengate',
    'havana',
    'seapoint',
    'montreal',
    'stanleypark',
    'stelvio',
    'edinburgh',
    'northshore',
    'campolongo',
    'marinabay',
    'serpentine',
    'champs',
    'tulips',
    'tourmalet',
    'napa',
    'glastonbury',
    'pikeplace',
    'hardknott',
    'alpe',
    'saguaro',
    'trollstigen',
    'poggio',
    'montmartre',
    'brickyard',
    'chichen',
    'bonneville',
    'como',
    'yosemite',
    'etna',
    'timessquare',
    'tremola',
    'teide',
    'monaco',
    'tempelhof',
    'paine',
    'ibiza',
    'skye',
    'toronto',
    'prospect',
    'calobra',
    'strade',
    'wicklow',
    'haleakala',
    'austin',
  ])('a class keeps its world %s (World Ride)', (world) => {
    const r = readOneClass('world', world);
    expect(r.problems).toEqual([]);
    expect(r.catalogue!.classes[0].world).toBe(world);
  });

  it.each([undefined, null])('a class with world %s has no world', (value) => {
    const r = readOneClass('world', value);
    expect(r.problems).toEqual([]);
    expect(r.catalogue!.classes[0].world).toBeNull();
  });

  it.each(['atlantis', 'OldTown', '', 3, { id: 'oldtown' }])(
    'a class with world %j is left out, naming the world field',
    (value) => {
      const r = readOneClass('world', value);
      expect(r.catalogue!.classes).toEqual([]);
      expect(r.problems).toEqual([
        {
          entry: 'steady',
          field: 'world',
          message: 'A world is one of the built-in scene ids.',
        },
      ]);
    },
  );

  it('two classes may share a world', () => {
    const r = read(
      [shelf()],
      [
        { ...cls('a'), world: 'oldtown' },
        { ...cls('b'), world: 'oldtown' },
      ],
    );
    expect(r.catalogue!.classes.map((c) => c.world)).toEqual(['oldtown', 'oldtown']);
  });
});
