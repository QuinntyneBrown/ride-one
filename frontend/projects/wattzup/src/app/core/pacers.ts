// The simulated pacers of the Riders nearby board (L2-107). Computed here only: never sent to
// the backend, never kept in a session (L1-015).
import type { WorldRidePacer } from '@wattzup/components';

export interface Pacer {
  readonly name: string;
  /** The rider colour, `--color-rider-<n>`; 4 is You. */
  readonly jersey: number;
  /** Metres ahead on average; negative is behind. */
  readonly base: number;
  readonly amp: number;
  /** Seconds. */
  readonly period: number;
  readonly phase: number;
}

/** The six pacers, in the order of L2-107. */
export const PACERS: readonly Pacer[] = [
  { name: 'Maya Okafor', jersey: 2, base: 46, amp: 28, period: 140, phase: 0.3 },
  { name: 'Jonas Lindqvist', jersey: 3, base: 18, amp: 14, period: 95, phase: 2.1 },
  { name: 'Ana Ferreira', jersey: 5, base: -14, amp: 16, period: 120, phase: 1.2 },
  { name: 'Kenji Watanabe', jersey: 7, base: -48, amp: 30, period: 200, phase: 4.0 },
  { name: 'Sophie Dubois', jersey: 1, base: 92, amp: 40, period: 260, phase: 5.1 },
  { name: 'Ravi Patel', jersey: 6, base: -96, amp: 36, period: 230, phase: 0.9 },
];

const YOU_JERSEY = 4;
const MIN_SPEED = 3;

/** Metres ahead of the rider at second `t`; negative is behind. */
export function pacerGap(pacer: Pacer, t: number): number {
  return pacer.base + pacer.amp * Math.sin(t / pacer.period + pacer.phase);
}

/** `+m:ss` ahead, `−m:ss` (U+2212) behind, in whole seconds. */
export function formatGap(seconds: number): string {
  const whole = Math.round(seconds);
  const abs = Math.abs(whole);
  const text = `${Math.floor(abs / 60)}:${String(abs % 60).padStart(2, '0')}`;
  return whole < 0 ? `−${text}` : `+${text}`;
}

/** The pacers and You, from furthest ahead to furthest behind (L2-107 AC2, AC3). */
export function pacerBoard(t: number, speedKmh: number | null): WorldRidePacer[] {
  const speed = Math.max((speedKmh ?? 0) / 3.6, MIN_SPEED);
  const rows = PACERS.map((p) => ({ gap: pacerGap(p, t), pacer: p }));
  return [
    ...rows.map(({ gap, pacer }) => ({
      gap,
      row: { name: pacer.name, jersey: pacer.jersey, timeGap: formatGap(gap / speed), you: false },
    })),
    { gap: 0, row: { name: 'You', jersey: YOU_JERSEY, timeGap: null, you: true } },
  ]
    .sort((a, b) => b.gap - a.gap)
    .map(({ row }) => row);
}
