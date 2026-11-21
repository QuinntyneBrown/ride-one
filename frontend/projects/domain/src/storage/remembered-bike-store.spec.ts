// Unit test
// Traces to: L2-015 AC1
// Description: the remembered bike survives a reload as one localStorage record; a record it cannot read counts as
// no bike, and forgetting removes it.
import { TestBed } from '@angular/core/testing';
import type { BikeInfo } from '@telo/api';
import { REMEMBERED_BIKE_KEY, RememberedBikeStore } from './remembered-bike-store';

const BIKE: BikeInfo = {
  id: 'kK3fA9==',
  name: 'Echelon EX-5s',
  identifier: 'EX5S-141844',
  kind: 'echelon',
};

describe('RememberedBikeStore', () => {
  let store: RememberedBikeStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [RememberedBikeStore] });
    store = TestBed.inject(RememberedBikeStore);
  });

  it('has no bike until one is saved', () => {
    expect(store.get()).toBeNull();
  });

  it('gives back the bike it saved, from a fresh store', () => {
    store.save(BIKE);

    expect(TestBed.runInInjectionContext(() => new RememberedBikeStore()).get()).toEqual(BIKE);
  });

  it.each([
    ['not JSON', '{'],
    ['not an object', '"bike"'],
    ['no id', JSON.stringify({ name: 'Echelon EX-5s', identifier: null, kind: 'echelon' })],
    ['an unknown kind', JSON.stringify({ id: 'a', name: 'b', identifier: null, kind: 'rower' })],
    ['a numeric identifier', JSON.stringify({ id: 'a', name: 'b', identifier: 5, kind: 'ftms' })],
  ])('counts a record that is %s as no bike', (_, raw) => {
    localStorage.setItem(REMEMBERED_BIKE_KEY, raw);

    expect(store.get()).toBeNull();
  });

  it('forgets the bike', () => {
    store.save(BIKE);
    store.forget();

    expect(store.get()).toBeNull();
  });
});
