import { Page, expect } from '@playwright/test';
import { Logger } from '../utils/logger';

/**
 * LoginPage — Page Object for ParaBank login screen
 */
export class LoginPage {
  private readonly usernameInput = this.page.locator('[name="username"]');
  private readonly passwordInput = this.page.locator('[name="password"]');
  private readonly loginButton   = this.page.locator('[value="Log In"]');
  private readonly errorMessage  = this.page.locator('.error');
  // M-02 fix: removed overly broad '#welcomeNote, .title' locator — .title matches
  // every heading on every page. Use the specific welcome paragraph instead.
  private readonly welcomeNote   = this.page.locator('#welcomeNote');

  constructor(private page: Page) {}

  async navigate() {
    Logger.info('Navigating to ParaBank login page');
    await this.page.goto('/parabank/index.htm');
  }

  async login(username: string, password: string) {
    Logger.info(`Logging in as user: ${username}`);
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL(/overview/);
    Logger.info('Login successful — accounts overview page loaded');
  }

  async expectLoginFailure(expectedMessage?: string) {
    await expect(this.errorMessage).toBeVisible();
    if (expectedMessage) {
      await expect(this.errorMessage).toContainText(expectedMessage);
    }
    Logger.warn('Login failed as expected');
  }

  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) ?? '';
  }
}
