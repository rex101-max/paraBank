import { Page, expect } from '@playwright/test';
import { Logger } from '../utils/logger';

/**
 * AccountsOverviewPage — verifies account balances and listings on the UI
 */
export class AccountsOverviewPage {
  private readonly accountRows    = this.page.locator('#accountTable tbody tr');
  // M-01 fix: replaced runtime AngularJS class with a semantic footer selector
  private readonly totalBalance   = this.page.locator('#accountTable tfoot td').nth(1);
  private readonly pageTitle      = this.page.locator('.title');

  constructor(private page: Page) {}

  async navigate() {
    Logger.info('Navigating to Accounts Overview');
    await this.page.goto('/parabank/overview.htm');
  }

  async expectPageLoaded() {
    await expect(this.pageTitle).toContainText('Accounts Overview');
  }

  /**
   * Returns balance string for a given account ID (e.g. "$1,200.50")
   */
  async getBalanceForAccount(accountId: string): Promise<string> {
    const row = this.page.locator(`#accountTable tbody tr:has-text("${accountId}")`);
    const balance = row.locator('td').nth(1);
    const text = (await balance.textContent())?.trim() ?? '';
    Logger.info(`Balance for account ${accountId}: ${text}`);
    return text;
  }

  async getAccountIds(): Promise<string[]> {
    const ids: string[] = [];
    const count = await this.accountRows.count();
    for (let i = 0; i < count; i++) {
      const id = (await this.accountRows.nth(i).locator('td').first().textContent())?.trim();
      if (id) ids.push(id);
    }
    return ids;
  }

  async expectAccountVisible(accountId: string) {
    const row = this.page.locator(`#accountTable tbody tr:has-text("${accountId}")`);
    await expect(row).toBeVisible();
    Logger.info(`Account ${accountId} is visible in overview`);
  }
}
