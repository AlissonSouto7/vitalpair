import { defineConfig, devices } from '@playwright/test'

/**
 * Browser tests: the application driven the way a person drives it.
 *
 * These are the only tests that exercise what the user actually touches. The backend suite
 * proves the API is correct and the component tests prove a widget behaves; neither would
 * notice a button that never became clickable, a form that submits to the wrong route, or a
 * session that silently ends on reload.
 *
 * They run against a real backend on :8081 and the production build served by `vite
 * preview`, not the dev server: the dev server transforms modules on demand and hides
 * bundling mistakes that only appear in the build users receive.
 */
export default defineConfig({
  testDir: './e2e',
  // A browser test that hangs is worse than one that fails, because CI waits for it.
  timeout: 45_000,
  expect: { timeout: 10_000 },
  // Serial on purpose. Every test signs in as the same account against one backend, and
  // registration and refresh are rate-limited per address: running files in parallel makes
  // them compete for that allowance and fail at random. Measured: 10 of 12 passing in
  // parallel against 12 of 12 serially. The limits are correct; the suite adapts to them.
  fullyParallel: false,
  workers: 1,
  // Fail the build if a test was left focused; otherwise the suite silently shrinks.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173',
    // Kept only for failures: a trace of every passing test is gigabytes of nothing.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Runs first and registers the one account the signed-in tests share.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  // preview serves dist/, so the suite tests the bundle that would be deployed.
  webServer: {
    command: 'npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
