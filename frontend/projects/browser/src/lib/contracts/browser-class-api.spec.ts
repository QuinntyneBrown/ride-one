// Unit Test
// Traces to: L2-096, L2-078
// Description: BrowserClassApi fetches classes.json once, answers the API's shapes, names what it
// leaves out and answers an empty catalogue when the file cannot be read.
import { TestBed } from '@angular/core/testing';
import { BrowserClassApi, CATALOGUE_FETCH, CATALOGUE_LOG } from './browser-class-api';

const flat = { kind: 'flat', level: 12, minutes: 20, cadence: 85 };
const shelf = (id: string) => ({ id, title: id.toUpperCase(), tagline: '' });
const cls = (id: string, shelfId = 'a', plan: object = flat) => ({
  id,
  title: `Class ${id}`,
  channel: 'Studio',
  focus: 'Zone 2',
  description: '',
  shelf: shelfId,
  plan,
});

function setup(answer: () => Promise<Response>) {
  const log = { warn: vi.fn(), error: vi.fn() };
  const fetchFile = vi.fn(answer);
  TestBed.configureTestingModule({
    providers: [
      BrowserClassApi,
      { provide: CATALOGUE_FETCH, useValue: fetchFile },
      { provide: CATALOGUE_LOG, useValue: log },
    ],
  });
  return { api: TestBed.inject(BrowserClassApi), log, fetchFile };
}
const json = (body: unknown) => () => Promise.resolve(new Response(JSON.stringify(body)));

describe('BrowserClassApi', () => {
  it('lists the shelves that hold a class, with their classes, in file order', async () => {
    const { api } = setup(
      json({
        shelves: [shelf('a'), shelf('b'), shelf('c')],
        classes: [cls('x', 'c'), cls('y', 'a')],
      }),
    );
    const list = await api.list();
    expect(list.shelves.map((s) => [s.id, s.classes.map((c) => c.id)])).toEqual([
      ['a', ['y']],
      ['c', ['x']],
    ]);
    expect(list.shelves[0].classes[0].shelf).toEqual({ id: 'a', title: 'A', tagline: '' });
  });

  it('gets a class by id, or not-found for an unknown or malformed id', async () => {
    const { api } = setup(json({ shelves: [shelf('a')], classes: [cls('x')] }));
    expect(((await api.get('x')) as { title: string }).title).toBe('Class x');
    expect(await api.get('nope')).toBe('not-found');
    expect(await api.get('../x')).toBe('not-found');
  });

  it('fetches the file once for the page', async () => {
    const { api, fetchFile } = setup(json({ shelves: [], classes: [] }));
    await api.list();
    await api.get('x');
    expect(fetchFile).toHaveBeenCalledTimes(1);
  });

  it('names each class it leaves out with a warning', async () => {
    const { api, log } = setup(
      json({ shelves: [shelf('a')], classes: [cls('x'), cls('bad', 'a', { ...flat, level: 40 })] }),
    );
    expect((await api.list()).shelves[0].classes.map((c) => c.id)).toEqual(['x']);
    expect(log.warn).toHaveBeenCalledTimes(1);
    expect(log.warn.mock.calls[0][0]).toContain('bad');
    expect(log.warn.mock.calls[0][0]).toContain('plan.level');
  });

  it.each([
    ['a 404', () => Promise.resolve(new Response('Not found', { status: 404 })), 'HTTP 404'],
    [
      'a network failure',
      () => Promise.reject(new TypeError('Failed to fetch')),
      'Failed to fetch',
    ],
    ['text that is not JSON', () => Promise.resolve(new Response('{oops')), 'not valid JSON'],
    [
      'a file over 1 MB',
      () => Promise.resolve(new Response(' '.repeat(1024 * 1024 + 1))),
      'larger than 1 MB',
    ],
  ])(
    'answers an empty catalogue for %s, with one error naming classes.json',
    async (_, answer, reason) => {
      const { api, log } = setup(answer);
      expect(await api.list()).toEqual({ shelves: [] });
      expect(log.error).toHaveBeenCalledTimes(1);
      expect(log.error.mock.calls[0][0]).toContain('classes.json');
      expect(log.error.mock.calls[0][0]).toContain(reason);
    },
  );
});
