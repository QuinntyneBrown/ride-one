// Where the rider's shadow in the sun lies (L2-174 AC12). The shadow is the rider's own figure as the sun sees it,
// laid on the road along the sun's rays (sun-shadow.ts draws it); this says which way those rays run and how far
// they carry a shadow. A sun near the horizon would throw the rider's shadow off the road and across the island, so
// a sun lower than `LOWEST_SUN` is counted as standing that high. No Three.js here.

/** The lowest the sun is counted as standing for a shadow, in radians. */
export const LOWEST_SUN = (20 * Math.PI) / 180;

/** The sun as a shadow is thrown from it. */
export interface ShadowSun {
  /** A unit vector from the ground towards the sun, in the map's axes (+y up). */
  x: number;
  y: number;
  z: number;
  /** A unit vector along the ground straight away from the sun: the way a shadow lies. */
  awayX: number;
  awayZ: number;
  /** The sun's height above the horizon as the shadow is thrown, in radians. */
  altitude: number;
}

/**
 * The sun a shadow is thrown from, for a course whose file says the light comes from `sun`: its bearing is the
 * file's, its height the file's or `LOWEST_SUN` if that is higher. A sun straight overhead throws its shadow
 * under the rider, lying along -x for want of a bearing.
 */
export function shadowSun(
  sun: readonly [number, number, number],
  into: ShadowSun = { x: 0, y: 1, z: 0, awayX: -1, awayZ: 0, altitude: Math.PI / 2 },
): ShadowSun {
  const [x, y, z] = sun;
  const flat = Math.hypot(x, z);
  const altitude = Math.min(Math.max(Math.atan2(y, flat), LOWEST_SUN), Math.PI / 2);
  const bearingX = flat > 1e-6 ? x / flat : 1;
  const bearingZ = flat > 1e-6 ? z / flat : 0;
  into.x = bearingX * Math.cos(altitude);
  into.y = Math.sin(altitude);
  into.z = bearingZ * Math.cos(altitude);
  into.awayX = -bearingX;
  into.awayZ = -bearingZ;
  into.altitude = altitude;
  return into;
}

/** How far along the ground, in metres, the shadow of a point `height` metres up lies from under it. */
export function shadowReach(height: number, altitude: number): number {
  return height / Math.tan(altitude);
}
