import { Page, expect } from '@playwright/test';
import * as fs from 'fs';
import { Logger } from '../utils/logger';

/**
 * TransferFundsPage — handles fund transfer flow
 */
export class TransferFundsPage {
  private readonly amountInput          = this.page.locator('#amount');
  private readonly fromAccountSelect    = this.page.locator('#fromAccountId');
  private readonly toAccountSelect      = this.page.locator('#toAccountId');
  private readonly transferButton       = this.page.locator('[value="Transfer"]');
  private readonly successHeader        = this.page.locator('#showResult h1, #showResult .title');
  private readonly transferAmount       = this.page.locator('#showResult p').filter({ hasText: /\$/ });

  constructor(private page: Page) {}

  async navigate() {
    Logger.info('Navigating to Transfer Funds page');
    await this.page.goto('/parabank/transfer.htm');
  }

  async transferFunds(amount: string, fromAccountId: string, toAccountId: string) {
    Logger.info(`Transferring $${amount} from ${fromAccountId} to ${toAccountId}`);

    await this.amountInput.fill(amount);
    await this.fromAccountSelect.selectOption(fromAccountId);
    await this.toAccountSelect.selectOption(toAccountId);

    await this.transferButton.click();

    await expect(this.successHeader).toBeVisible({ timeout: 10_000 });

    // M-04 fix: ensure screenshots directory exists before writing
    fs.mkdirSync('test-results/screenshots', { recursive: true });
    await this.page.screenshot({ path: `test-results/screenshots/transfer-${Date.now()}.png` });
    Logger.info('Transfer completed successfully');
  }

  async expectTransferSuccess() {
    await expect(this.successHeader).toContainText('Transfer Complete');
    Logger.info('Transfer success message verified');
  }

  async getConfirmedAmount(): Promise<string> {
    return (await this.transferAmount.textContent())?.trim() ?? '';
  }
}
