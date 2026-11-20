import { defineConfig, devices } from '@playwright/test';

// Behaviour specs only, Chromium only. No real bike: e2e/fixtures/wz-test.ts installs a fake
// navigator.bluetooth and fails any request off localhost.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  // CI runners have few cores and the specs mostly wait on the browser, so use them all; locally the default
  // (half the cores) is faster than more.
  workers: process.env['CI'] ? '100%' : undefined,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:4300',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
    // The build registers a service worker; its fetches would pass the specs' route fakes by, so
    // only offline.spec.ts allows it.
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium' }],
  // The production build, served statically as any static host would: it starts in seconds where the dev server
  // compiles on demand. The build is incremental, so a rebuild with no change is quick.
  webServer: {
    command: 'npx ng build wattzup && node scripts/serve-dist.mjs 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
