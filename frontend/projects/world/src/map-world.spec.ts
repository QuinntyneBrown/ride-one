import { worldForMap } from './map-world';

describe('worldForMap (L2-080)', () => {
  it('draws the class’s world, Ibiza Sunset Strip', () => {
    expect(worldForMap('ibiza')).toMatchObject({ id: 'ibiza', name: 'Ibiza Sunset Strip' });
  });

  it.each(['atlantis', 'vicecity'])('refuses %s, a world no scene draws', (world) => {
    expect(() => worldForMap(world)).toThrow(`Unknown world ${world}`);
  });
});
