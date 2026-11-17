import {
  DEFAULT_VIDEO_DRAFT,
  LINK_ERROR,
  formatStart,
  linkError,
  parseStart,
  planVideo,
  readVideoDraft,
  stepStart,
  videoIdOf,
} from './video-link';

// The same rows as YouTubeLinkTests in Wattzup.Core.Tests (L2-010 criteria 14 and 16).
describe('videoIdOf (L2-029 AC18, AC19)', () => {
  it.each([
    'https://www.youtube.com/watch?v=QUoToFsMNig',
    'http://www.youtube.com/watch?v=QUoToFsMNig',
    'www.youtube.com/watch?v=QUoToFsMNig',
    'youtube.com/watch?v=QUoToFsMNig',
    'https://m.youtube.com/watch?v=QUoToFsMNig&t=40',
    'm.youtube.com/watch?v=QUoToFsMNig&t=40',
    'https://www.youtube.com/watch?feature=share&v=QUoToFsMNig',
    'https://youtu.be/QUoToFsMNig',
    'youtu.be/QUoToFsMNig?t=12',
    'https://www.youtube.com/shorts/QUoToFsMNig',
    'youtube.com/shorts/QUoToFsMNig',
    'https://www.youtube.com/embed/QUoToFsMNig',
    'www.youtube.com/embed/QUoToFsMNig',
    '  https://youtu.be/QUoToFsMNig  ',
  ])('reads %j', (url) => {
    expect(videoIdOf(url)).toBe('QUoToFsMNig');
  });

  it('keeps - and _ in the id', () => {
    expect(videoIdOf('https://youtu.be/a-b_C1d2E3f')).toBe('a-b_C1d2E3f');
  });

  it.each([
    'https://vimeo.com/76979871',
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/watch?v=QUoToFsMNig1',
    'https://www.youtube.com/watch?v=QUoToFs$Nig',
    'javascript:alert(1)',
    'https://www.youtube.com.evil.example/watch?v=QUoToFsMNig',
    'https://evil.example/youtu.be/QUoToFsMNig',
    'ftp://youtu.be/QUoToFsMNig',
    'https://www.youtube.com/channel/QUoToFsMNig',
    'https://www.youtube.com/watch',
    '',
  ])('refuses %j', (url) => {
    expect(videoIdOf(url)).toBeNull();
  });

  it('refuses a link over 2048 characters', () => {
    expect(
      videoIdOf('https://www.youtube.com/watch?v=QUoToFsMNig&x=' + 'a'.repeat(2048)),
    ).toBeNull();
  });
});

describe('the start point (L2-029 AC18)', () => {
  it.each([
    [0, '0:00.0'],
    [12, '0:12.0'],
    [12.3, '0:12.3'],
    [61.5, '1:01.5'],
    [3599.9, '59:59.9'],
    [3600, '1:00:00.0'],
    [43200, '12:00:00.0'],
  ])('formats %d as %s and reads it back', (seconds, text) => {
    expect(formatStart(seconds)).toBe(text);
    expect(parseStart(text)).toBe(seconds);
  });

  it.each([
    ['12', 12],
    ['12.5', 12.5],
    [' 1:30 ', 90],
    ['0:60', null],
    ['1:60:00', null],
    ['12:00:00.1', null],
    ['12.25', null],
    ['-1', null],
    ['x', null],
  ])('reads %j as %j', (text, seconds) => {
    expect(parseStart(text)).toBe(seconds);
  });

  it.each([
    [12, 1, 12.5],
    [12, -1, 11.5],
    [0.4, -1, 0],
    [0, -1, 0],
    [43200, 1, 43200],
  ] as const)('steps %d by %d to %d', (from, dir, to) => {
    expect(stepStart(from, dir)).toBe(to);
  });
});

describe('the plan video (L2-029 AC17, AC19, AC20)', () => {
  const gcn = 'https://www.youtube.com/watch?v=QUoToFsMNig';

  it('is null with the switch off, empty or not YouTube', () => {
    expect(planVideo(DEFAULT_VIDEO_DRAFT)).toBeNull();
    expect(planVideo({ on: false, url: gcn, start: 12 })).toBeNull();
    expect(planVideo({ on: true, url: '', start: 0 })).toBeNull();
    expect(planVideo({ on: true, url: 'https://vimeo.com/76979871', start: 0 })).toBeNull();
  });

  it('carries the trimmed link and the start point', () => {
    expect(planVideo({ on: true, url: ` ${gcn} `, start: 12 })).toEqual({
      url: gcn,
      start_seconds: 12,
    });
  });

  it('names only a non-empty link that is not YouTube', () => {
    expect(linkError({ on: true, url: 'https://vimeo.com/76979871', start: 0 })).toBe(LINK_ERROR);
    expect(linkError({ on: true, url: ' ', start: 0 })).toBeNull();
    expect(linkError({ on: true, url: gcn, start: 0 })).toBeNull();
    expect(linkError({ on: false, url: 'https://vimeo.com/1', start: 0 })).toBeNull();
  });

  it('restores a stored draft and falls back for anything else', () => {
    const stored = { on: true, url: gcn, start: 12 };
    expect(readVideoDraft(JSON.stringify(stored))).toEqual(stored);
    for (const raw of [
      null,
      '',
      '{',
      '{"on":"yes","url":"","start":0}',
      '{"on":true,"url":"","start":-1}',
    ]) {
      expect(readVideoDraft(raw)).toEqual(DEFAULT_VIDEO_DRAFT);
    }
  });
});
