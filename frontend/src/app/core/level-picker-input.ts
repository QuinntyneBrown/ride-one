// What the level picker's keys and taps choose (L2-020, L2-041): a pure helper for the slider.
export const MIN_LEVEL = 1;
export const MAX_LEVEL = 32;
const PAGE = 4;
/** Where a key press starts when nothing is set yet, as Raise and Lower do. */
const START = 12;

const clamp = (level: number): number => Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));

/** The level a key moves to from `current`, or null for a key the slider does not handle. */
export function levelForKey(key: string, current: number | null): number | null {
  const from = current ?? START;
  switch (key) {
    case 'ArrowRight':
    case 'ArrowUp':
      return clamp(from + 1);
    case 'ArrowLeft':
    case 'ArrowDown':
      return clamp(from - 1);
    case 'PageUp':
      return clamp(from + PAGE);
    case 'PageDown':
      return clamp(from - PAGE);
    case 'Home':
      return MIN_LEVEL;
    case 'End':
      return MAX_LEVEL;
    default:
      return null;
  }
}

/** The level under a tap `fraction` of the way across the bars (0 = left edge, 1 = right edge). */
export function levelAtFraction(fraction: number): number {
  return clamp(Math.floor(fraction * MAX_LEVEL) + 1);
}
