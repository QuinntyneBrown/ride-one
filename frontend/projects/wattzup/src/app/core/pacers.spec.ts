import { formatGap, PACERS, pacerBoard, pacerGap } from './pacers';

const byName = (name: string) => PACERS.find((p) => p.name === name)!;

// L2-107 AC2: base + amp × sin(t ÷ period + phase), one case per row, at t 300.
describe('pacerGap (L2-107)', () => {
  it.each([
    ['Maya Okafor', 64.011],
    ['Jonas Lindqvist', 6.0319],
    ['Ana Ferreira', -22.4774],
    ['Kenji Watanabe', -69.1662],
    ['Sophie Dubois', 90.8266],
    ['Ravi Patel', -66.9865],
  ])('%s is %d m ahead at t 300', (name, metres) => {
    expect(pacerGap(byName(name), 300)).toBeCloseTo(metres, 3);
  });
});

describe('formatGap', () => {
  it.each([
    [0, '+0:00'],
    [12.002, '+0:12'],
    [-4.215, '−0:04'],
    [72.5, '+1:13'],
    [-0.4, '+0:00'],
  ])('writes %d s as %s', (seconds, text) => {
    expect(formatGap(seconds)).toBe(text);
  });
});

describe('pacerBoard (L2-107)', () => {
  it('lists the pacers and You from furthest ahead, as the default mock', () => {
    expect(pacerBoard(300, 19.2)).toEqual([
      { name: 'Sophie Dubois', jersey: 1, timeGap: '+0:17', you: false },
      { name: 'Maya Okafor', jersey: 2, timeGap: '+0:12', you: false },
      { name: 'Jonas Lindqvist', jersey: 3, timeGap: '+0:01', you: false },
      { name: 'You', jersey: 4, timeGap: null, you: true },
      { name: 'Ana Ferreira', jersey: 5, timeGap: '−0:04', you: false },
      { name: 'Ravi Patel', jersey: 6, timeGap: '−0:13', you: false },
      { name: 'Kenji Watanabe', jersey: 7, timeGap: '−0:13', you: false },
    ]);
  });

  it.each([0, null])('floors the speed at 3 m/s at %s km/h', (speed) => {
    const maya = pacerBoard(300, speed).find((r) => r.name === 'Maya Okafor');
    // 64.0 m ÷ 3 m/s = 21.3 s
    expect(maya?.timeGap).toBe('+0:21');
  });
});
