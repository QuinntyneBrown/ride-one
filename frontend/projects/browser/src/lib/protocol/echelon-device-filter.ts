// Mirrors Wattzup.Protocol/EchelonDeviceFilter.cs: an Echelon bike, never an Echelon treadmill
// (L2-001, L2-090 AC2).
import { ECHELON_UUIDS } from './echelon-uuids';

/** The name prefix of Echelon's Stride treadmills, which share the Echelon service. */
const TREADMILL_NAME_PREFIX = 'STRIDE';

/** True when the name starts with `ECH` or the services include the Echelon service, ignoring
 * case, and the name does not start with a treadmill's `STRIDE`. */
export function matchesBike(name: string | null, serviceUuids: readonly string[]): boolean {
  const text = (name ?? '').toUpperCase();
  if (text.startsWith(TREADMILL_NAME_PREFIX)) return false;
  return (
    text.startsWith('ECH') || serviceUuids.some((u) => u.toLowerCase() === ECHELON_UUIDS.service)
  );
}

/** The same rule as options for the browser's device chooser (`requestDevice`). `namePrefix` is
 * case-sensitive, hence 3 spellings for the case-insensitive rule of L2-001. */
export const BIKE_FILTER = {
  filters: [
    { namePrefix: 'ECH' },
    { namePrefix: 'Ech' },
    { namePrefix: 'ech' },
    { services: [ECHELON_UUIDS.service] },
  ],
  exclusionFilters: [{ namePrefix: TREADMILL_NAME_PREFIX }],
  optionalServices: [ECHELON_UUIDS.service],
};
