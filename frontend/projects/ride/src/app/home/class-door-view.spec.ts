// Unit test
// Traces to: L2-035 AC1, AC2
// Description: the Classes door features the first class on the 30 min shelf, with its title, its length as minutes
// and seconds, and its cover; with none there, it features nothing.
import type { ClassCatalogueDto, ClassDto } from '@telo/api';
import { classDoorView } from './class-door-view';

const lesson = (id: string, shelfId: string): ClassDto =>
  ({
    id,
    title: `Class ${id}`,
    lengthSeconds: 1800,
    shelfId,
    video: { videoId: 'QUoToFsMNig', syncOffsetSeconds: 0 },
  }) as ClassDto;

const catalogue = (...classes: ClassDto[]): ClassCatalogueDto => ({ shelves: [], classes });

describe('classDoorView', () => {
  it('features the first class on the 30 min shelf, with its length and cover', () => {
    expect(
      classDoorView(catalogue(lesson('a', '45-min'), lesson('b', '30-min'), lesson('c', '30-min'))),
    ).toEqual({
      classId: 'b',
      title: 'Class b',
      length: '30:00',
      coverUrl: 'https://i.ytimg.com/vi/QUoToFsMNig/mqdefault.jpg',
    });
  });

  it('features nothing when the shelf holds no class', () => {
    expect(classDoorView(catalogue(lesson('a', '45-min')))).toBeNull();
  });
});
