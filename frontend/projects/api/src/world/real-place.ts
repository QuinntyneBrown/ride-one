/**
 * The real place a map follows (L2-066): its name ("Bruges"), the stretch the route rides ("Steenstraat to the Markt")
 * and the latitude and longitude, in degrees, the tiles centre on.
 */
export interface RealPlace {
  readonly name: string;
  readonly route: string;
  readonly latitude: number;
  readonly longitude: number;
}
