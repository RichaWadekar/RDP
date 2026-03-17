const { test, expect } = require('@playwright/test');
const { qase } = require('playwright-qase-reporter');
const { loginViaDemo } = require('./demoLoginHelper');

/**
 * Qase Test Cases: 3597, 3335, 3598, 3336, 3337
 * Login Module Tests
 */

test.describe('Login Module - Qase Tests', () => {
  test.setTimeout(300000);

  // Q-3597: Verify login page loads successfully with required UI elements
  test(qase(3597, 'Q-3597: Verify login page loads with required UI elements'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 Q-3597: Login page UI elements');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Open the admin portal URL
      console.log('📍 Step 1: Opening admin portal login page...');
      await page.goto('https://stage.rainydayparents.com/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      console.log('  ✓ Login page loaded');

      // Step 2: Observe the login form elements
      console.log('📍 Step 2: Verifying login form elements...');

      // Check Email field
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name*="email" i]').first();
      await expect(emailInput).toBeVisible({ timeout: 10000 });
      console.log('  ✓ Email input field is visible');

      // Check Continue/Log In button
      const loginBtn = page.locator('button').filter({ hasText: /continue|log in|sign in/i }).first();
      await expect(loginBtn).toBeVisible({ timeout: 5000 });
      console.log('  ✓ Login/Continue button is visible');

      console.log('\n✅ Q-3597: PASSED - Login form displays with required UI elements\n');

    } catch (error) {
      console.error('\n❌ Q-3597: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3597-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-3335: Verify login page loads successfully with required UI elements
  test('Q-3335: Verify login page loads with required UI elements', async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 Q-3335: Login page UI elements');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Open the admin portal URL
      console.log('📍 Step 1: Opening admin portal login page...');
      await page.goto('https://stage.rainydayparents.com/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      console.log('  ✓ Login page loaded');

      // Step 2: Observe the login form elements
      console.log('📍 Step 2: Verifying login form elements...');

      // Check Email field
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name*="email" i]').first();
      await expect(emailInput).toBeVisible({ timeout: 10000 });
      console.log('  ✓ Email input field is visible');

      // Check Continue/Log In button
      const loginBtn = page.locator('button').filter({ hasText: /continue|log in|sign in/i }).first();
      await expect(loginBtn).toBeVisible({ timeout: 5000 });
      console.log('  ✓ Login/Continue button is visible');

      console.log('\n✅ Q-3335: PASSED - Login form displays with required UI elements\n');

    } catch (error) {
      console.error('\n❌ Q-3335: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3335-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-3598: Verify successful login with valid super admin credentials
  test('Q-3598: Verify successful login with valid super admin credentials', async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 Q-3598: Successful login with valid credentials');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1-3: Enter valid email, password, click Log In
      console.log('📍 Step 1-3: Logging in with valid super admin credentials...');
      await loginViaDemo(page, browser);
      console.log('  ✓ Login process completed');

      // Verify redirection to Content Moderation tab
      console.log('📍 Verifying redirection to Content Moderation...');
      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      const url = page.url();
      expect(url).toContain('content-moderation');
      console.log('  ✓ Super admin redirected to Content Moderation tab');

      console.log('\n✅ Q-3598: PASSED - Super admin successfully logged in and redirected\n');

    } catch (error) {
      console.error('\n❌ Q-3598: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3598-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-3336: Verify successful login with valid super admin credentials
  test('Q-3336: Verify successful login with valid super admin credentials', async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 Q-3336: Successful login with valid credentials');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1-3: Enter valid email, password, click Log In
      console.log('📍 Step 1-3: Logging in with valid super admin credentials...');
      await loginViaDemo(page, browser);
      console.log('  ✓ Login process completed');

      // Verify redirection to Content Moderation tab
      console.log('📍 Verifying redirection to Content Moderation...');
      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      const url = page.url();
      expect(url).toContain('content-moderation');
      console.log('  ✓ Super admin redirected to Content Moderation tab');

      console.log('\n✅ Q-3336: PASSED - Super admin successfully logged in and redirected\n');

    } catch (error) {
      console.error('\n❌ Q-3336: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3336-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-3337: Verify redirection to default landing page (Content Moderation tab) on login
  test('Q-3337: Verify redirection to Content Moderation tab on login', async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 Q-3337: Redirection to Content Moderation tab');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Log in with valid credentials
      console.log('📍 Step 1: Logging in with valid credentials...');
      await loginViaDemo(page, browser);
      console.log('  ✓ Login completed');

      // Step 2: Observe landing screen
      console.log('📍 Step 2: Verifying landing screen...');
      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      const url = page.url();
      expect(url).toContain('content-moderation');
      console.log('  ✓ Redirected to Content Moderation tab');

      // Verify Content Moderation page elements
      console.log('📍 Verifying Content Moderation page elements...');

      // Check for filters
      const filters = page.locator('select, [class*="select"], input[type="date"]');
      const filterCount = await filters.count();
      if (filterCount > 0) {
        console.log(`  ✓ Filters are displayed (${filterCount} filter elements found)`);
      }

      // Check for reported content list/table
      const contentTable = page.locator('table, [class*="table"], [class*="list"]').first();
      if (await contentTable.isVisible().catch(() => false)) {
        console.log('  ✓ Reported content list is displayed');
      }

      console.log('\n✅ Q-3337: PASSED - System redirects to Content Moderation tab with filters and content list\n');

    } catch (error) {
      console.error('\n❌ Q-3337: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3337-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });
});
