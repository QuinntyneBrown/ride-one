/** A place as English reads it: 1st, 2nd, 3rd, 4th, 11th, 12th, 13th, 21st. */
export function ordinal(place: number): string {
  const teen = place % 100 >= 11 && place % 100 <= 13;
  const suffix = teen
    ? 'th'
    : (({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[place % 10] ?? 'th');
  return `${place}${suffix}`;
}
