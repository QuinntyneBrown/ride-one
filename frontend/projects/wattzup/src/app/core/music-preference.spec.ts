import { TestBed } from '@angular/core/testing';
import { MUSIC_KEY, MusicPreference } from './music-preference';

describe('MusicPreference (L2-128 AC5)', () => {
  beforeEach(() => localStorage.clear());

  it('is on when no choice is kept', () => {
    expect(TestBed.inject(MusicPreference).on()).toBe(true);
  });

  it('turns off and on, keeping the choice', () => {
    const music = TestBed.inject(MusicPreference);
    music.toggle();
    expect(music.on()).toBe(false);
    expect(localStorage.getItem(MUSIC_KEY)).toBe('off');
    music.toggle();
    expect(music.on()).toBe(true);
    expect(localStorage.getItem(MUSIC_KEY)).toBe('on');
  });

  it('reads a kept off', () => {
    localStorage.setItem(MUSIC_KEY, 'off');
    expect(TestBed.inject(MusicPreference).on()).toBe(false);
  });

  it('treats an unknown value as on', () => {
    localStorage.setItem(MUSIC_KEY, 'loud');
    expect(TestBed.inject(MusicPreference).on()).toBe(true);
  });
});
