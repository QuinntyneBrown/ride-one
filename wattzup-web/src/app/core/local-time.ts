// Local wall-clock formatting for the UI (en-US, as in the mocks).
const minutes = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
const seconds = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
});

/** `7:07 PM` */
export function clockTime(date: Date): string {
  return minutes.format(date);
}

/** `7:10:12 PM`, or `never`. */
export function epochTime(epochSeconds: number | null): string {
  return epochSeconds === null ? 'never' : seconds.format(new Date(epochSeconds * 1000));
}

/** `7:10:12` without the day period, for the command log. */
export function epochClock(epochSeconds: number): string {
  return seconds.format(new Date(epochSeconds * 1000)).replace(/\s?[AP]M$/, '');
}
