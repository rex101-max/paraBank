import { test as base } from '@playwright/test';
import { ApiHelper } from '../utils/apiHelper';
import { LoginPage } from '../pages/LoginPage';
import { OpenAccountPage } from '../pages/OpenAccountPage';
import { TransferFundsPage } from '../pages/TransferFundsPage';
import { AccountsOverviewPage } from '../pages/AccountsOverviewPage';
import { ENV } from '../config/env';

type ParaBankFixtures = {
  apiHelper:            ApiHelper;
  loginPage:            LoginPage;
  openAccountPage:      OpenAccountPage;
  transferFundsPage:    TransferFundsPage;
  accountsOverviewPage: AccountsOverviewPage;
  authenticatedPage:    { username: string; password: string; customerId: string };
};

/**
 * Extended Playwright test with ParaBank-specific fixtures.
 * Import `test` and `expect` from this file in every spec.
 */
export const test = base.extend<ParaBankFixtures>({
  apiHelper: async ({ request }, use) => {
    await use(new ApiHelper(request));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  openAccountPage: async ({ page }, use) => {
    await use(new OpenAccountPage(page));
  },

  transferFundsPage: async ({ page }, use) => {
    await use(new TransferFundsPage(page));
  },

  accountsOverviewPage: async ({ page }, use) => {
    await use(new AccountsOverviewPage(page));
  },

  // Provides pre-defined credentials from ENV / environment variables
  authenticatedPage: async ({}, use) => {
    await use({
      username:   ENV.username,
      password:   ENV.password,
      customerId: ENV.customerId,
    });
  },
});

export { expect } from '@playwright/test';
