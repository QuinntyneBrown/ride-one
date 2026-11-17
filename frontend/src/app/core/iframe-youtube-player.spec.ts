import { embedSrc } from './iframe-youtube-player';

describe('embedSrc (L2-076 AC8)', () => {
  it('builds the nocookie embed from the id alone, cued at the whole second', () => {
    const url = new URL(embedSrc('QUoToFsMNig', 12.7, 'http://127.0.0.1:8787'));
    expect(url.origin).toBe('https://www.youtube-nocookie.com');
    expect(url.pathname).toBe('/embed/QUoToFsMNig');
    expect(url.searchParams.get('start')).toBe('12');
    expect(url.searchParams.get('enablejsapi')).toBe('1');
    expect(url.searchParams.get('playsinline')).toBe('1');
    expect(url.searchParams.get('origin')).toBe('http://127.0.0.1:8787');
  });

  it('escapes an id it is given, so nothing but the path is set', () => {
    expect(new URL(embedSrc('a/b?c', 0, 'x')).pathname).toBe('/embed/a%2Fb%3Fc');
  });
});
