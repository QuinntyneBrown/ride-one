import type { ClassResult } from '@telo/api';

/** Class Done as the screen draws it (docs/mocks/pages/class-done/). */
export interface ClassDoneView {
  /** "Intervals to the Beat". */
  readonly title: string;
  /** The output as a whole number of kJ ("351"; L2-078 AC4). */
  readonly output: string;
  /** The ride's running time ("20:00"). */
  readonly time: string;
  /** The average watts as a whole number ("293"). */
  readonly average: string;
  /** What a screen reader hears as Class Done opens (L2-141 AC2): "Class done: 351 kJ in 20:00." */
  readonly announcement: string;
}

/** Whole seconds as "0:57", "26:38" or, from an hour, "1:02:03". */
function clock(seconds: number): string {
  const s = String(seconds % 60).padStart(2, '0');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}:${s}`;
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}:${s}`;
}

/**
 * Class Done from the result the ride hands over (L2-078): the output in whole kJ (AC4), the running time, and the
 * average watts, round(output in kJ × 1000 ÷ running seconds) (AC3), 0 for a ride of no seconds.
 */
export function classDoneView(result: ClassResult): ClassDoneView {
  const output = String(Math.round(result.outputKj));
  const time = clock(result.elapsedSeconds);
  const average =
    result.elapsedSeconds > 0 ? Math.round((result.outputKj * 1000) / result.elapsedSeconds) : 0;
  return {
    title: result.title,
    output,
    time,
    average: String(average),
    announcement: `Class done: ${output} kJ in ${time}.`,
  };
}
