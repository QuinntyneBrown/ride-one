import { defineConfig, devices } from '@playwright/test';

// Behaviour specs only, Chromium only. No real backend or bike: e2e/fixtures/wz-test.ts
// answers every /api/** request and stubs the event stream.
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
    baseURL: 'http://localhost:4300',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // The production build, served statically: it starts in seconds where the dev server compiles on demand, and
  // it is what the backend serves (L2-001). The build is incremental, so a rebuild with no change is quick.
  webServer: {
    command: 'npx ng build wattzup && node scripts/serve-dist.mjs 4300',
    url: 'http://localhost:4300',
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
