// Unit test
// Traces to: L2-176 AC1, AC2, AC4, AC6, AC7
// Description: nothing is made or fetched until the first play; the track loops from its own origin's path; pause holds
// it and the next play carries on; release pauses it, drops its source and forgets it; and a browser that refuses to
// play leaves the ride untouched.
import { BrowserRideMusic, RIDE_MUSIC_PATH } from './browser-ride-music';

class FakeAudio {
  static made: FakeAudio[] = [];
  loop = false;
  paused = true;
  attributes = new Map<string, string>();
  calls: string[] = [];
  refuse = false;

  constructor(src: string) {
    this.attributes.set('src', src);
    FakeAudio.made.push(this);
  }
  play(): Promise<void> {
    this.calls.push('play');
    if (this.refuse) return Promise.reject(new Error('NotAllowedError'));
    this.paused = false;
    return Promise.resolve();
  }
  pause(): void {
    this.calls.push('pause');
    this.paused = true;
  }
  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }
  load(): void {
    this.calls.push('load');
  }
}

describe('BrowserRideMusic', () => {
  beforeEach(() => {
    FakeAudio.made = [];
    vi.stubGlobal('Audio', FakeAudio);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('makes nothing, and fetches nothing, until the first play (L2-176 AC2)', () => {
    const music = new BrowserRideMusic();
    music.pause();
    music.release();
    expect(FakeAudio.made).toEqual([]);
  });

  it('plays the one track, looping, from the app’s own path (L2-176 AC1, AC2)', () => {
    new BrowserRideMusic().play();
    const [audio] = FakeAudio.made;
    expect(RIDE_MUSIC_PATH).toBe('music/beautiful-boom-bap.mp3');
    expect(audio!.attributes.get('src')).toBe(RIDE_MUSIC_PATH);
    expect(audio!.loop).toBe(true);
    expect(audio!.paused).toBe(false);
  });

  it('holds the track on pause and plays the same element on (L2-176 AC4)', () => {
    const music = new BrowserRideMusic();
    music.play();
    music.pause();
    expect(FakeAudio.made[0]!.paused).toBe(true);
    music.play();
    expect(FakeAudio.made).toHaveLength(1);
    expect(FakeAudio.made[0]!.paused).toBe(false);
  });

  it('pauses, drops the source and forgets the element on release (L2-176 AC6)', () => {
    const music = new BrowserRideMusic();
    music.play();
    music.release();
    const audio = FakeAudio.made[0]!;
    expect(audio.paused).toBe(true);
    expect(audio.attributes.has('src')).toBe(false);
    expect(audio.calls).toContain('load');
    // A second release has nothing to do, and a later play starts a new element.
    music.release();
    expect(audio.calls.filter((call) => call === 'load')).toHaveLength(1);
    music.play();
    expect(FakeAudio.made).toHaveLength(2);
  });

  it('leaves the ride as it is when the browser refuses to play (L2-176 AC7)', async () => {
    const music = new BrowserRideMusic();
    vi.spyOn(FakeAudio.prototype, 'play').mockImplementation(() =>
      Promise.reject(new Error('NotAllowedError')),
    );
    expect(() => music.play()).not.toThrow();
    await Promise.resolve();
    expect(() => music.pause()).not.toThrow();
  });
});
