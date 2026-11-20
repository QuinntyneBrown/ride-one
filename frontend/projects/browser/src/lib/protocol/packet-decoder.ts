// Decodes a notify frame
// (L2-005 to L2-007). The trailing checksum is not checked.
import { toKmh, toMph } from './speed-calculator';

export const MARKER = 0xf0;
export const WORKOUT_DATA = 0xd1;
export const RESISTANCE = 0xd2;

/** A `0xD2` frame: the level the bike reports. */
export interface ResistanceUpdate {
  kind: 'resistance';
  level: number;
}
/** A `0xD1` frame: cadence and the speed derived from it. */
export interface CadenceUpdate {
  kind: 'cadence';
  rpm: number;
  speedKmh: number;
  speedMph: number;
}
export type TelemetryUpdate = ResistanceUpdate | CadenceUpdate;

export function decode(frame: Uint8Array): TelemetryUpdate | null {
  if (frame.length < 4 || frame[0] !== MARKER) return null;
  switch (frame[1]) {
    case RESISTANCE:
      return { kind: 'resistance', level: frame[3] };
    case WORKOUT_DATA: {
      if (frame.length < 13) return null;
      const rpm = (frame[9] << 8) | frame[10];
      return { kind: 'cadence', rpm, speedKmh: toKmh(rpm), speedMph: toMph(rpm) };
    }
    default:
      return null;
  }
}
