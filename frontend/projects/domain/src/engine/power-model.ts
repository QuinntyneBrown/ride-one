import { bankersRound } from './bankers-round';

const watts = (cadence: number, level: number): number =>
  Math.max(0, bankersRound(cadence * (0.55 + level * 0.155)));

/**
 * The Echelon reports no power: it is estimated as max(0, round(cadence × (0.55 + level × 0.155))) W (ADR 0003,
 * L2-023 AC1), unknown when cadence or resistance is (AC2). A segment's target power uses the same formula with its
 * cadence aim (AC3).
 */
export const PowerModel = {
  estimate(cadence: number | null, level: number | null): number | null {
    return cadence === null || level === null ? null : watts(cadence, level);
  },
  target(cadenceAim: number, level: number): number {
    return watts(cadenceAim, level);
  },
} as const;
