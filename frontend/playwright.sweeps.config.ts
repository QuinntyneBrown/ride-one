import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Accessibility, responsive and performance sweeps (AGENTS.md): written and kept current, run only when a
// person asks, with `npm run e2e:sweeps`. Chromium only, like the behaviour specs.
export default defineConfig({
  ...base,
  testMatch: 'sweeps/**/*.sweep.ts',
  // The performance sweep's numbers go to performance-reports/ as JSON and Markdown (#676).
  reporter: [[base.reporter as 'list' | 'github'], ['./e2e/sweeps/performance-reporter.ts']],
});
