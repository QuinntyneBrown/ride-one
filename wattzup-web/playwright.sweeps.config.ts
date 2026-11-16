import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Accessibility and responsive sweeps (AGENTS.md): written and kept current, run only when a
// person asks, with `npm run e2e:sweeps`. Chromium only, like the behaviour specs.
export default defineConfig({
  ...base,
  testMatch: 'sweeps/**/*.sweep.ts',
});
