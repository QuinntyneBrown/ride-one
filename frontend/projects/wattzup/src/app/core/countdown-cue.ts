/** The final-seconds cue: pulse at 5…1, beep at 3, 2 and 1 (L2-027). */
export function countdownCue(
  wholeSecondsLeft: number,
  running: boolean,
): { pulse: boolean; beep: boolean } {
  if (!running) return { pulse: false, beep: false };
  return {
    pulse: wholeSecondsLeft >= 1 && wholeSecondsLeft <= 5,
    beep: wholeSecondsLeft >= 1 && wholeSecondsLeft <= 3,
  };
}
