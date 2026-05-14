import { test, expect } from '../../fixtures/parabank.fixtures';
import { ENV } from '../../config/env';
import { Logger } from '../../utils/logger';

/**
 * Performance Lite Test Suite
 *
 * Covers:
 *  - API response time threshold (< 2 s per ENV config)
 *  - 20 concurrent GET accounts requests (throughput)
 *  - UI page load timing via performance.timing
 *
 * @tags @api
 */

test.describe('Performance Engineering @api', () => {

  test('PERF-01 | API response time stays below threshold @api', async ({
    apiHelper,
    authenticatedPage,
  }) => {
    const start = Date.now();
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);
    const elapsed = Date.now() - start;

    Logger.info(`GET accounts response time: ${elapsed}ms (threshold: ${ENV.apiPerfThresholdMs}ms)`);
    expect(accounts.length, 'Accounts list should not be empty').toBeGreaterThan(0);
    expect(elapsed, `Response time ${elapsed}ms exceeded ${ENV.apiPerfThresholdMs}ms`).toBeLessThan(
      ENV.apiPerfThresholdMs
    );
  });

  test('PERF-02 | 20 concurrent GET accounts requests complete without errors @api', async ({
    apiHelper,
    authenticatedPage,
  }) => {
    // C-02 fix: getAccountsConcurrent now uses Promise.allSettled and throws
    // a summarised error if ANY individual request fails, so this test will
    // correctly fail when reliability degrades under concurrent load.
    await apiHelper.getAccountsConcurrent(
      authenticatedPage.customerId,
      ENV.concurrentRequestCount
    );
  });

  test('PERF-03 | UI page load time captured via performance API @api', async ({
    page,
    loginPage,
    authenticatedPage,
  }) => {
    await loginPage.navigate();
    await loginPage.login(authenticatedPage.username, authenticatedPage.password);
    await loginPage.expectLoginSuccess();

    // L-01 fix: performance.timing (Level 1) is deprecated.
    // Use PerformanceNavigationTiming (Level 2) instead.
    const timing = await page.evaluate(() => {
      const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (!entry) return { domContentLoaded: 0, loadComplete: 0 };
      return {
        domContentLoaded: Math.round(entry.domContentLoadedEventEnd),
        loadComplete:     Math.round(entry.loadEventEnd),
      };
    });

    Logger.info('UI page load timing', timing);

    // Log a warning if the page is slow — not a hard failure for UI
    if (timing.loadComplete > 5000) {
      Logger.warn(`UI load time is high: ${timing.loadComplete}ms`);
    }

    // Sanity check: timing values must be positive
    expect(timing.domContentLoaded).toBeGreaterThan(0);
    expect(timing.loadComplete).toBeGreaterThan(0);
  });

});
