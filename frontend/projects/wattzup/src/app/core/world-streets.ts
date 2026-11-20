// The street module of each scene built on the shared kit (world-kit.ts), by scene id. The
// renderer builds a scene's street from here in place of its panorama and generic posts.
import type { WorldId } from '@wattzup/api';
import { CaribanaStreet } from './world-caribana';
import { SouthBeachStreet } from './world-southbeach';
import { KnicksStreet } from './world-knicks';
import { VeniceStreet } from './world-venice';
import { KoppenbergStreet } from './world-koppenberg';
import type { StreetFactory } from './world-kit';
import { DaytonaStreet } from './world-daytona';
import { GizaStreet } from './world-giza';
import { AmsterdamStreet } from './world-amsterdam';
import { Route66Street } from './world-route66';
import { VegasStreet } from './world-vegas';
import { NottingHillStreet } from './world-nottinghill';
import { SuburbiaStreet } from './world-suburbia';
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
  suburbia: (track, disposables) => new SuburbiaStreet(track, disposables),
  nottinghill: (track, disposables) => new NottingHillStreet(track, disposables),
  knicks: (track, disposables) => new KnicksStreet(track, disposables),
  vegas: (track, disposables) => new VegasStreet(track, disposables),
  route66: (track, disposables) => new Route66Street(track, disposables),
  venice: (track, disposables) => new VeniceStreet(track, disposables),
  amsterdam: (track, disposables) => new AmsterdamStreet(track, disposables),
  giza: (track, disposables) => new GizaStreet(track, disposables),
  daytona: (track, disposables) => new DaytonaStreet(track, disposables),
  koppenberg: (track, disposables) => new KoppenbergStreet(track, disposables),
};
