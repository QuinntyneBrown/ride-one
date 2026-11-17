// The UI theme: dark unless the rider picks light; the device preference is ignored (L2-061).
import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { SafeStorage } from '@wattzup/api';

export type Theme = 'dark' | 'light';

export const THEME_KEY = 'wattzup.theme';

/** Only an explicit `light` turns the light theme on. */
export function readTheme(stored: string | null): Theme {
  return stored === 'light' ? 'light' : 'dark';
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly root = inject(DOCUMENT).documentElement;
  private readonly storage = new SafeStorage(() => localStorage);
  private readonly _theme = signal<Theme>(readTheme(this.storage.get(THEME_KEY)));
  readonly theme = this._theme.asReadonly();

  constructor() {
    this.apply();
  }

  toggle(): void {
    this._theme.set(this._theme() === 'dark' ? 'light' : 'dark');
    this.storage.set(THEME_KEY, this._theme());
    this.apply();
  }

  private apply(): void {
    this.root.dataset['theme'] = this._theme();
  }
}
