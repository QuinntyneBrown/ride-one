import type { FakeBike } from './fake-bluetooth';

// The Echelon GATT identifiers (L2.md, Pair a bike and Initialise the bike).
export const ECHELON_SERVICE = '0bf669f1-45f2-11e7-9598-0800200c9a66';
export const ECHELON_WRITE = '0bf669f2-45f2-11e7-9598-0800200c9a66';
export const ECHELON_NOTIFY = '0bf669f4-45f2-11e7-9598-0800200c9a66';

/** An Echelon EX-5s as the fake Bluetooth stack offers it. */
export const echelonBike: FakeBike = {
  name: 'ECH-EX5S-141844',
  services: { [ECHELON_SERVICE]: [ECHELON_WRITE, ECHELON_NOTIFY] },
};
