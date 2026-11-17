import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it } from 'vitest';
import { THEME_KEY, ThemeService, readTheme } from './theme.service';

describe('readTheme (L2-061)', () => {
  it.each([
    [null, 'dark'],
    ['dark', 'dark'],
    ['light', 'light'],
    ['Light', 'dark'],
    ['sepia', 'dark'],
  ] as const)('reads stored %s as %s', (stored, theme) => {
    expect(readTheme(stored)).toBe(theme);
  });
});

describe('ThemeService (L2-061)', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('applies dark when nothing is stored', () => {
    const service = TestBed.inject(ThemeService);
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('applies a stored light theme', () => {
    localStorage.setItem(THEME_KEY, 'light');
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('toggle flips the theme, writes data-theme and saves the choice', () => {
    const service = TestBed.inject(ThemeService);
    service.toggle();
    expect(service.theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem(THEME_KEY)).toBe('light');
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(localStorage.getItem(THEME_KEY)).toBe('dark');
  });
});
