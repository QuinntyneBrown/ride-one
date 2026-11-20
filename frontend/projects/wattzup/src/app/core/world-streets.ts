// The street module of each scene built on the shared kit (world-kit.ts), by scene id. The
// renderer builds a scene's street from here in place of its panorama and generic posts.
import type { WorldId } from '@wattzup/api';
import { CaribanaStreet } from './world-caribana';
import { SouthBeachStreet } from './world-southbeach';
import type { StreetFactory } from './world-kit';
import { BlackpoolStreet } from './world-blackpool';
import { GhentStreet } from './world-ghent';
import { CentralParkStreet } from './world-centralpark';
import { WestminsterStreet } from './world-westminster';

export const STREETS: Partial<Record<WorldId, StreetFactory>> = {
  caribana: (track, disposables) => new CaribanaStreet(track, disposables),
  southbeach: (track, disposables) => new SouthBeachStreet(track, disposables),
  westminster: (track, disposables) => new WestminsterStreet(track, disposables),
  centralpark: (track, disposables) => new CentralParkStreet(track, disposables),
  ghent: (track, disposables) => new GhentStreet(track, disposables),
  blackpool: (track, disposables) => new BlackpoolStreet(track, disposables),
};
