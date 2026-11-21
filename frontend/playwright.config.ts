import { defineConfig, devices } from '@playwright/test';

// E2E_PORT moves the spec server when another checkout already serves 4300.
const port = Number(process.env['E2E_PORT'] ?? 4300);

// Behaviour specs only, Chromium only, never retried (AGENTS.md). e2e/fixtures/test.ts fails a spec on a page error or
// a request off localhost.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  workers: process.env['CI'] ? '100%' : undefined,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${port}`,
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium' }],
  // The production build, served statically as the static host serves it.
  webServer: {
    command: `npx ng build ride && node scripts/serve-dist.mjs ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 180_000,
  },
});
