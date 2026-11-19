// .NET's Math.Round modes, which JavaScript's Math.round matches for neither negative halves nor
// decimals. The mirrors round exactly as Wattzup.Core does.

/** `Math.Round(value, digits, MidpointRounding.AwayFromZero)`. */
export function roundAwayFromZero(value: number, digits = 0): number {
  const scale = 10 ** digits;
  const scaled = Number((Math.abs(value) * scale).toPrecision(15));
  return (Math.sign(value) * Math.round(scaled)) / scale;
}
