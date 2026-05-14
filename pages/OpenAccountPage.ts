import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import { Logger } from '../utils/logger';

export type AccountType = 'CHECKING' | 'SAVINGS';

/**
 * OpenAccountPage — handles account creation flow
 */
export class OpenAccountPage {
  private readonly accountTypeSelect    = this.page.locator('#type');
  private readonly fromAccountSelect    = this.page.locator('#fromAccountId');
  private readonly openAccountButton    = this.page.locator('[value="Open New Account"]');
  private readonly newAccountLink       = this.page.locator('#newAccountId a');
  private readonly successHeader        = this.page.locator('#openAccountResult h1, #openAccountResult .title');
  private readonly congratsMessage      = this.page.locator('#openAccountResult p');

  constructor(private page: Page) {}

  async navigate() {
    Logger.info('Navigating to Open New Account page');
    await this.page.goto('/parabank/openaccount.htm');
  }

  async openAccount(accountType: AccountType, fromAccountId?: string): Promise<string> {
    Logger.info(`Opening new ${accountType} account`);

    // C-01 fix: select by visible label instead of fragile numeric value
    await this.accountTypeSelect.selectOption({ label: accountType });

    if (fromAccountId) {
      await this.fromAccountSelect.selectOption(fromAccountId);
    }

    await this.openAccountButton.click();

    // Wait for success response
    await expect(this.successHeader).toBeVisible({ timeout: 10_000 });

    const newAccountId = (await this.newAccountLink.textContent())?.trim() ?? '';
    Logger.info(`New account created: ${newAccountId}`);

    // M-04 fix: ensure screenshots directory exists before writing
    fs.mkdirSync('test-results/screenshots', { recursive: true });
    await this.page.screenshot({ path: `test-results/screenshots/account-created-${newAccountId}.png` });
    return newAccountId;
  }

  /**
   * Validates that the newly created account has the expected type.
   * C-01 fix: always assert type after creation so wrong-type creation is caught.
   */
  async expectAccountType(expectedType: AccountType) {
    // The result page echoes the account type in the success section
    await expect(this.page.locator('#openAccountResult')).toContainText(expectedType);
    Logger.info(`Account type confirmed as ${expectedType}`);
  }

  async expectSuccessMessage() {
    await expect(this.successHeader).toContainText('Account Opened');
    await expect(this.congratsMessage).toContainText('Congratulations');
  }

  async getNewAccountId(): Promise<string> {
    return (await this.newAccountLink.textContent())?.trim() ?? '';
  }
}
