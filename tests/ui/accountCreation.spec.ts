import { test, expect } from '../../fixtures/parabank.fixtures';
import { Logger } from '../../utils/logger';

/**
 * UI Tests — Account Creation (FR-01, FR-08, FR-09)
 * @tags @smoke @regression
 */

test.describe('Account Creation — UI', () => {
  test.beforeEach(async ({ loginPage, authenticatedPage }) => {
    await loginPage.navigate();
    await loginPage.login(authenticatedPage.username, authenticatedPage.password);
    await loginPage.expectLoginSuccess();
  });

  // TC-AC-UI-01: Positive — create new Savings account
  test('TC-AC-UI-01 | Create new Savings account successfully @smoke', async ({
    openAccountPage,
  }) => {
    await openAccountPage.navigate();
    const newAccountId = await openAccountPage.openAccount('SAVINGS');

    expect(newAccountId).toBeTruthy();
    expect(newAccountId.length).toBeGreaterThan(0);
    await openAccountPage.expectSuccessMessage();
    // C-01 fix: assert the actual type matches what was requested
    await openAccountPage.expectAccountType('SAVINGS');
  });

  // TC-AC-UI-02: Positive — create new Checking account
  test('TC-AC-UI-02 | Create new Checking account successfully @regression', async ({
    openAccountPage,
  }) => {
    await openAccountPage.navigate();
    const newAccountId = await openAccountPage.openAccount('CHECKING');

    expect(newAccountId).toBeTruthy();
    await openAccountPage.expectSuccessMessage();
    // C-01 fix: assert the actual type matches what was requested
    await openAccountPage.expectAccountType('CHECKING');
  });

  // TC-AC-UI-03: Verify success message is shown (FR-08)
  test('TC-AC-UI-03 | Success message is displayed after account creation @smoke', async ({
    openAccountPage,
    page,
  }) => {
    await openAccountPage.navigate();
    await openAccountPage.openAccount('SAVINGS');

    const successText = page.locator('#openAccountResult');
    await expect(successText).toBeVisible();
    await expect(successText).toContainText('Congratulations');
  });
});

test.describe('Login — Negative Scenarios (FR-09)', () => {
  // TC-NEG-01: Invalid credentials
  test('TC-NEG-01 | Login with invalid credentials shows error @regression', async ({
    loginPage,
  }) => {
    await loginPage.navigate();
    await loginPage.login('invalid_user_xyz', 'wrong_pass');
    await loginPage.expectLoginFailure();
  });

  // TC-NEG-02: Empty username
  test('TC-NEG-02 | Login with empty username shows validation error @regression', async ({
    loginPage,
    page,
  }) => {
    await loginPage.navigate();

    // L-02 fix: HTML5 `required` on the username field may prevent form submission
    // entirely in some browsers (Firefox especially), so the server-side .error
    // element never renders. We check EITHER the browser validation message OR
    // the server-side error — both constitute a blocked login.
    await loginPage.login('', 'demo');

    const browserValidation = await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>('[name="username"]');
      return input?.validity.valueMissing ?? false;
    });

    if (browserValidation) {
      // Browser caught it before submission — still a valid blocked-login result
      Logger.info('TC-NEG-02: empty username blocked by browser HTML5 validation');
    } else {
      // Server returned an error page
      await loginPage.expectLoginFailure();
    }
  });
});
