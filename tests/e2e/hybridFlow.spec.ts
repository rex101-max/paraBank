import { test, expect } from '../../fixtures/parabank.fixtures';
import { parseCurrency } from '../../utils/testDataGenerator';
import { Logger } from '../../utils/logger';

/**
 * Hybrid E2E Tests — UI action + API validation
 * Covers: FR-01, FR-03, FR-05, FR-06, FR-07
 * @tags @e2e @regression
 */

test.describe('Hybrid E2E — Account + Transfer @e2e', () => {
  test.beforeEach(async ({ loginPage, authenticatedPage }) => {
    await loginPage.navigate();
    await loginPage.login(authenticatedPage.username, authenticatedPage.password);
    await loginPage.expectLoginSuccess();
  });

  // TC-E2E-01: Create account via UI → validate in API (FR-01, FR-03)
  test('TC-E2E-01 | Create account via UI and validate existence via API @e2e @smoke', async ({
    openAccountPage,
    apiHelper,
    authenticatedPage,
  }) => {
    // Step 1 — Create account via UI
    await openAccountPage.navigate();
    const newAccountId = await openAccountPage.openAccount('SAVINGS');
    await openAccountPage.expectSuccessMessage();

    Logger.info(`Created account via UI: ${newAccountId}`);

    // Step 2 — Validate via API (FR-03)
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);
    const accountIds = accounts.map(a => String(a.id));

    expect(accountIds).toContain(newAccountId);
    Logger.info('New account confirmed in API response');

    // Step 3 — Validate account details via API (FR-04)
    const accountDetail = await apiHelper.getAccountById(newAccountId);
    apiHelper.validateAccountSchema(accountDetail);
    expect(accountDetail.type).toBe('SAVINGS');
  });

  // TC-E2E-02: Transfer funds via UI → validate balance change via API (FR-05, FR-06, FR-07)
  test('TC-E2E-02 | Transfer funds via UI and validate balances via API @e2e @regression', async ({
    transferFundsPage,
    accountsOverviewPage,
    apiHelper,
    authenticatedPage,
  }) => {
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);
    expect(accounts.length).toBeGreaterThanOrEqual(2);

    const fromAccount = accounts[0];
    const toAccount   = accounts[1];
    const transferAmt = 100;

    // Step 1 — Capture balances BEFORE transfer (FR-07)
    const balanceBefore = {
      from: fromAccount.balance,
      to:   toAccount.balance,
    };
    Logger.info('Balances BEFORE transfer', balanceBefore);

    // Step 2 — Execute transfer via UI
    await transferFundsPage.navigate();
    await transferFundsPage.transferFunds(
      String(transferAmt),
      String(fromAccount.id),
      String(toAccount.id),
    );
    await transferFundsPage.expectTransferSuccess();

    // Step 3 — Validate balances AFTER via API (FR-06, FR-07)
    const fromAfter = await apiHelper.getAccountById(String(fromAccount.id));
    const toAfter   = await apiHelper.getAccountById(String(toAccount.id));

    Logger.info('Balances AFTER transfer', {
      from: fromAfter.balance,
      to:   toAfter.balance,
    });

    expect(fromAfter.balance).toBeCloseTo(balanceBefore.from - transferAmt, 2);
    expect(toAfter.balance).toBeCloseTo(balanceBefore.to + transferAmt, 2);

    Logger.info('Balance validation passed — transfer applied correctly');
  });

  // TC-E2E-03: Create account via UI → verify appears in accounts overview UI
  test('TC-E2E-03 | New account appears in UI Accounts Overview @e2e', async ({
    openAccountPage,
    accountsOverviewPage,
  }) => {
    await openAccountPage.navigate();
    const newAccountId = await openAccountPage.openAccount('CHECKING');

    await accountsOverviewPage.navigate();
    await accountsOverviewPage.expectAccountVisible(newAccountId);
  });
});
