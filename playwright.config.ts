import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration — ParaBank Capstone
 * Multi-browser | Parallel | Retry | HTML + Allure reporters
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 4 : 2,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    ['html',              { outputFolder: 'reports/html-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'reports/allure-results' }],
    ['list'],
    ['json',              { outputFile: 'reports/test-results.json' }],
  ],

  use: {
    baseURL: process.env.PARABANK_BASE_URL ?? 'https://parabank.parasoft.com',
    trace:       'on-first-retry',
    screenshot:  'only-on-failure',
    video:       'retain-on-failure',
    actionTimeout:     10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    // UI tests run on two browsers (per capstone requirement)
    {
      name: 'chromium',
      testMatch: ['**/tests/ui/**', '**/tests/e2e/**', '**/tests/performance/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testMatch: ['**/tests/ui/**', '**/tests/e2e/**'],
      use: { ...devices['Desktop Firefox'] },
    },
    // API tests run as a separate project (no browser needed)
    {
      name: 'api',
      testMatch: ['**/tests/api/**'],
      use: {
        baseURL: process.env.PARABANK_BASE_URL ?? 'https://parabank.parasoft.com',
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],

  outputDir: 'test-results/',
});
