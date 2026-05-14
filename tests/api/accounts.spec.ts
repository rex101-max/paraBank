import { test, expect } from '../../fixtures/parabank.fixtures';

/**
 * API Tests — Account validation (FR-02, FR-03, FR-04, FR-06)
 * @tags @api @regression
 */

test.describe('GET Accounts API @api', () => {
  // TC-API-01: Validate accounts list returns 200
  test('TC-API-01 | GET accounts returns 200 and non-empty list @api', async ({
    apiHelper,
    authenticatedPage,
  }) => {
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);

    expect(Array.isArray(accounts)).toBe(true);
    expect(accounts.length).toBeGreaterThan(0);
  });

  // TC-API-02: Validate account schema (FR-04)
  test('TC-API-02 | Account schema has required fields and correct types @api', async ({
    apiHelper,
    authenticatedPage,
  }) => {
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);
    const account = accounts[0];

    // Schema validation
    apiHelper.validateAccountSchema(account);

    expect(typeof account.id).toBe('number');
    expect(typeof account.balance).toBe('number');
    expect(['CHECKING', 'SAVINGS']).toContain(account.type);
  });

  // TC-API-03: Validate account type field (FR-04)
  test('TC-API-03 | All accounts have valid account types @api', async ({
    apiHelper,
    authenticatedPage,
  }) => {
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);

    for (const account of accounts) {
      expect(['CHECKING', 'SAVINGS']).toContain(account.type);
      expect(account.balance).toBeGreaterThanOrEqual(0);
    }
  });

  // TC-API-04: Get individual account by ID (FR-03)
  test('TC-API-04 | GET account by ID returns correct data @api', async ({
    apiHelper,
    authenticatedPage,
  }) => {
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);
    const targetId = String(accounts[0].id);

    const account = await apiHelper.getAccountById(targetId);

    expect(account.id).toBe(accounts[0].id);
    apiHelper.validateAccountSchema(account);
  });
});

test.describe('Performance Checks @api', () => {
  // TC-PERF-01: API response time < 2 seconds
  test('TC-PERF-01 | GET accounts responds within 2 seconds @api', async ({
    apiHelper,
    authenticatedPage,
  }) => {
    // ApiHelper already throws if > 2000ms
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);
    expect(accounts).toBeDefined();
  });

  // TC-PERF-02: 20 concurrent requests (throughput validation)
  test('TC-PERF-02 | GET accounts 20 concurrent requests complete without errors @api', async ({
    apiHelper,
    authenticatedPage,
  }) => {
    // C-02 fix: errors are no longer swallowed — any failed request will
    // cause this test to fail with a clear summary message.
    await apiHelper.getAccountsConcurrent(authenticatedPage.customerId, 20);
  });
});
