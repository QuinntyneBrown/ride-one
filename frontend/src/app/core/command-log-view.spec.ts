import { commandLabel, commandTime, statusText } from './command-log-view';

describe('command-log-view (L2-048)', () => {
  const at = (o: object) =>
    ({
      at: 0,
      ride_seconds: 421,
      level: 18,
      source: 'plan',
      status: 'ack',
      ack_ms: 40,
      command: 'resistance',
      value: 18,
      ...o,
    }) as const;
  it('shows ride time as m:ss or h:mm:ss', () => {
    expect(commandTime(at({}), () => 'x')).toBe('7:01');
    expect(commandTime(at({ ride_seconds: 3720 }), () => 'x')).toBe('1:02:00');
  });
  it('shows the local time of at with no ride time', () => {
    expect(commandTime(at({ ride_seconds: null, at: 5 }), (s) => `L${s}`)).toBe('L5');
  });
  it.each([
    [{ status: 'ack', ack_ms: 38 }, 'ack 38ms'],
    [{ status: 'sending', ack_ms: null }, 'sending'],
    [{ status: 'failed', ack_ms: null }, 'failed'],
  ])('status %o', (o, text) => {
    expect(statusText(at(o))).toBe(text);
  });

  it.each([
    [{ command: 'resistance', level: 18, value: 18 }, 'RES 18'],
    [{ command: 'speed', level: null, value: 9 }, 'SPD 9.0'],
    [{ command: 'speed', level: null, value: 8.5 }, 'SPD 8.5'],
    [{ command: 'incline', level: null, value: 2 }, 'INC 2'],
  ])('labels %j as %s', (o, label) => {
    expect(commandLabel(at(o))).toBe(label);
  });
});
