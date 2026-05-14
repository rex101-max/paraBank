import { Page, Locator } from '@playwright/test';
import { Logger } from './logger';

/**
 * SmartLocator — MCP-inspired self-healing selector strategy.
 *
 * Tries a prioritized list of selectors for the same element.
 * If the primary selector fails, falls back to alternatives automatically.
 * This mirrors MCP (Model Context Protocol) adaptive locator concepts.
 */
export class SmartLocator {
  constructor(private page: Page) {}

  /**
   * Resolve a locator using a fallback chain.
   * Primary selector is tried first; if not visible within timeout,
   * each fallback is tried in order.
   */
  async resolve(
    selectors: string[],
    options: { timeout?: number; description?: string } = {},
  ): Promise<Locator> {
    const { timeout = 3000, description = 'element' } = options;

    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const locator  = this.page.locator(selector);

      try {
        await locator.waitFor({ state: 'visible', timeout });
        if (i > 0) {
          Logger.warn(`SmartLocator: primary selector failed, used fallback[${i}] for "${description}"`);
        }
        return locator;
      } catch {
        Logger.debug(`SmartLocator: selector "${selector}" not found, trying next...`);
      }
    }

    throw new Error(
      `SmartLocator: all selectors failed for "${description}".\nTried: ${selectors.join(', ')}`,
    );
  }

  /**
   * Pre-defined smart locators for ParaBank elements.
   * Each returns the first matching visible locator.
   */
  async loginButton(): Promise<Locator> {
    return this.resolve(
      ['[value="Log In"]', 'button:has-text("Log In")', 'input[type="submit"]'],
      { description: 'Login button' },
    );
  }

  async openAccountButton(): Promise<Locator> {
    return this.resolve(
      ['[value="Open New Account"]', 'button:has-text("Open New Account")', 'input[type="submit"]'],
      { description: 'Open Account button' },
    );
  }

  async transferButton(): Promise<Locator> {
    return this.resolve(
      ['[value="Transfer"]', 'button:has-text("Transfer")', 'input[type="submit"]'],
      { description: 'Transfer button' },
    );
  }
}
