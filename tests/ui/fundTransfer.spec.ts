import { test, expect } from '../../fixtures/parabank.fixtures';
import { generateTransferAmount } from '../../utils/testDataGenerator';

/**
 * UI Tests — Fund Transfer (FR-05, FR-08)
 * @tags @smoke @regression
 */

test.describe('Fund Transfer — UI', () => {
  test.beforeEach(async ({ loginPage, authenticatedPage }) => {
    await loginPage.navigate();
    await loginPage.login(authenticatedPage.username, authenticatedPage.password);
    await loginPage.expectLoginSuccess();
  });

  // TC-FT-UI-01: Transfer with valid data
  test('TC-FT-UI-01 | Transfer funds between accounts successfully @smoke', async ({
    transferFundsPage,
    accountsOverviewPage,
    authenticatedPage,
    apiHelper,
  }) => {
    // Fetch accounts to get valid from/to IDs
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);
    // M-03 fix: skip gracefully instead of failing with a confusing assertion error
    // when the demo account doesn't have enough accounts pre-created
    if (accounts.length < 2) {
      test.skip(true, 'Precondition not met: need ≥2 accounts for a transfer test — create one first via Open New Account');
      return;
    }

    const fromAccount = String(accounts[0].id);
    const toAccount   = String(accounts[1].id);
    const amount      = generateTransferAmount(10, 100);

    await transferFundsPage.navigate();
    await transferFundsPage.transferFunds(amount, fromAccount, toAccount);
    await transferFundsPage.expectTransferSuccess();
  });

  // TC-FT-UI-02: Success message validation (FR-08)
  test('TC-FT-UI-02 | Transfer Complete message is displayed @smoke', async ({
    transferFundsPage,
    authenticatedPage,
    apiHelper,
    page,
  }) => {
    const accounts = await apiHelper.getAccounts(authenticatedPage.customerId);
    // M-03 fix: skip gracefully if precondition not met
    if (accounts.length < 2) {
      test.skip(true, 'Precondition not met: need ≥2 accounts for a transfer test');
      return;
    }

    await transferFundsPage.navigate();
    await transferFundsPage.transferFunds(
      '50',
      String(accounts[0].id),
      String(accounts[1].id),
    );

    const result = page.locator('#showResult');
    await expect(result).toBeVisible();
    await expect(result).toContainText('Transfer Complete');
  });
});
