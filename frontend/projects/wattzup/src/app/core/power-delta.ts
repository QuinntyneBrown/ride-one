// The power readout's verdict against the segment target (L2-021).
import type { WorkoutStatus } from '@wattzup/api';

export type DeltaTone = 'on' | 'high' | 'low';

export interface PowerDelta {
  text: string;
  tone: DeltaTone;
}

export function powerDelta(
  power: number | null,
  target: number | null,
  status: WorkoutStatus | null,
): PowerDelta | null {
  if (status === null || target === null) return null;
  if (status !== 'running') return { text: 'Paused', tone: 'low' };
  if (power === null) return null;
  const diff = power - target;
  if (Math.abs(diff) <= 0.08 * target) return { text: 'On target', tone: 'on' };
  return diff > 0 ? { text: `+${diff} W`, tone: 'high' } : { text: `${diff} W`, tone: 'low' };
}
