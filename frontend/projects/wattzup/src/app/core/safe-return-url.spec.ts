import { safeReturnUrl } from './safe-return-url';

describe('safeReturnUrl (L2-055)', () => {
  it.each([
    ['/', '/'],
    ['/setup', '/setup'],
    ['/setup?x=1', '/setup?x=1'],
    ['//evil.example', '/'],
    ['https://evil.example', '/'],
    ['setup', '/'],
    [null, '/'],
    ['/\\evil', '/'],
  ])('%s → %s', (value, expected) => {
    expect(safeReturnUrl(value)).toBe(expected);
  });
});
