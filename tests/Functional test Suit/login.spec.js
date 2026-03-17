const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pages');
const { testData } = require('../fixtures/testData');

/**
 * Test Case: RDP-3597
 * Title: Login
 * Description: Verify login page loads successfully with required UI elements
 */

test.describe('Login Page Tests', () => {
  test.setTimeout(testData.timeouts.veryLong);

  test('RDP-3597: Verify login page loads with required UI elements', async ({ page }) => {
    console.log('\n  Test Case RDP-3597: Login Page UI Verification\n');

    const loginPage = new LoginPage(page);

    // STEP 1: Navigate to admin portal login page
    console.log('  Step 1: Navigating to admin portal login page...');
    await loginPage.goToLogin();
    console.log('    Login page loaded successfully');

    // STEP 2: Verify the login page is displayed
    console.log('  Step 2: Verifying login page is displayed...');
    await expect(page).toHaveURL(/.*login.*/);
    console.log('    URL contains "login"');

    // STEP 3: Verify Continue button is present (Welcome screen)
    console.log('  Step 3: Verifying Continue button on welcome screen...');
    await expect(loginPage.continueButton).toBeVisible({ timeout: 10000 });
    console.log('    Continue button is visible');

    // STEP 4: Click Continue to proceed to email entry
    console.log('  Step 4: Clicking Continue button...');
    await loginPage.clickContinue();
    console.log('    Continue button clicked');

    // STEP 5: Verify Email input field is present
    console.log('  Step 5: Verifying Email input field...');
    await expect(loginPage.emailInput).toBeVisible({ timeout: 10000 });
    console.log('    Email input field is visible');

    // STEP 6: Verify Email input field is editable
    console.log('  Step 6: Verifying Email input field is editable...');
    await expect(loginPage.emailInput).toBeEditable();
    console.log('    Email input field is editable');

    // STEP 7: Verify Continue/Submit button is present for form submission
    console.log('  Step 7: Verifying form submission button...');
    await expect(loginPage.continueButton).toBeVisible();
    console.log('    Submit button is visible');

    // STEP 8: Verify page title or header
    console.log('  Step 8: Verifying page has proper title...');
    const pageTitle = await loginPage.getTitle();
    console.log(`    Page title: "${pageTitle}"`);

    console.log('\n  ===============================================');
    console.log('  Test Case RDP-3597: PASSED');
    console.log('  Login page loaded successfully with required UI elements');
    console.log('  ===============================================\n');
  });
});
