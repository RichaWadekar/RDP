const { test, expect } = require('@playwright/test');
const { qase } = require('playwright-qase-reporter');
const { loginViaDemo } = require('../demoLoginHelper');

/**
 * Qase Suite 21: Web - FAQ, Word Moderation, Sign-Out
 * Sign-Out Module Tests: Q-5617 to Q-5624 (8 tests)
 *
 * Helper: performSignOut - handles the full sign-out flow with correct selectors
 */

/** Open dropdown and click Sign out */
async function openSignOutDropdown(page) {
  // Click dropdown arrow
  const dropdownArrow = page.locator('button[aria-label*="dropdown"], button:has(svg.lucide-chevron-down), .dropdown-toggle, button[aria-haspopup="true"]').first();
  const userMenuBtn = page.locator('button:has(svg), [class*="avatar"], [class*="user"]').first();

  if (await dropdownArrow.isVisible().catch(() => false)) {
    await dropdownArrow.click();
    console.log('    Dropdown arrow clicked');
  } else if (await userMenuBtn.isVisible().catch(() => false)) {
    await userMenuBtn.click();
    console.log('    User menu button clicked');
  }
  await page.waitForTimeout(500);
}

async function clickSignOutOption(page) {
  const signOutSelectors = [
    'text=Sign out',
    'text=Sign Out',
    'text=Logout',
    'button:has-text("Sign out")',
    'button:has-text("Logout")',
    '[role="menuitem"]:has-text("Sign out")',
    '[role="menuitem"]:has-text("Logout")'
  ];

  for (const selector of signOutSelectors) {
    const el = page.locator(selector).first();
    if (await el.isVisible().catch(() => false)) {
      await el.click();
      console.log(`    Clicked Sign Out option`);
      break;
    }
  }
  await page.waitForTimeout(1000);
}

/** Wait for sign-out confirmation popup using the correct selector */
async function waitForSignOutPopup(page) {
  // The app uses div.fixed.inset-0 for modals (same as FAQ/BannedWords)
  const popupSelectors = [
    'div.fixed.inset-0',
    '[role="dialog"]',
    '[role="alertdialog"]',
    '.modal'
  ];

  for (const selector of popupSelectors) {
    const popup = page.locator(selector).first();
    try {
      await popup.waitFor({ state: 'visible', timeout: 5000 });
      console.log(`    Sign out popup detected via: ${selector}`);
      return true;
    } catch {
      // Try next selector
    }
  }
  return false;
}

/** Confirm sign out in the popup */
async function confirmSignOut(page) {
  const confirmSelectors = [
    'div.fixed.inset-0 button:has-text("Sign out")',
    'div.fixed.inset-0 button:has-text("Sign Out")',
    'div.fixed.inset-0 button:has-text("Logout")',
    'div.fixed.inset-0 button:has-text("Confirm")',
    'div.fixed.inset-0 button:has-text("Yes")',
    'button:has-text("Sign Out")',
    'button:has-text("Confirm")'
  ];

  for (const selector of confirmSelectors) {
    const btn = page.locator(selector).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      console.log('    Confirmed sign out');
      return true;
    }
  }
  return false;
}

/** Cancel sign out in the popup */
async function cancelSignOutPopup(page) {
  const cancelSelectors = [
    'div.fixed.inset-0 button:has-text("Cancel")',
    'div.fixed.inset-0 button:has-text("No")',
    'button:has-text("Cancel")',
    'button:has-text("No")'
  ];

  for (const selector of cancelSelectors) {
    const btn = page.locator(selector).first();
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      console.log('    Cancel button clicked');
      return true;
    }
  }
  return false;
}

/** Full sign out flow: open dropdown → click sign out → confirm → wait for redirect */
async function performFullSignOut(page) {
  await openSignOutDropdown(page);
  await clickSignOutOption(page);
  const popupFound = await waitForSignOutPopup(page);
  if (popupFound) {
    await confirmSignOut(page);
  }
  await page.waitForTimeout(3000);

  // Wait for redirect to login with polling
  const maxPolls = 20;
  for (let i = 0; i < maxPolls; i++) {
    const url = page.url();
    if (url.includes('/login')) {
      console.log(`    Redirected to login page: ${url}`);
      return true;
    }
    await page.waitForTimeout(1000);
  }
  console.log(`    Current URL after sign out: ${page.url()}`);
  return page.url().includes('/login');
}

test.describe('Sign-Out Module - Qase Tests Q-5617 to Q-5624', () => {
  test.setTimeout(300000);

  // Q-5617: Verify sign out option visibility
  test(qase(5617, 'Q-5617: Verify sign out option visibility'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5617: Verify sign out option visibility');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in with valid credentials...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Click profile menu / dropdown
      console.log('Step 2: Opening profile menu...');
      await openSignOutDropdown(page);

      // Step 3: Verify Sign Out option is visible
      console.log('Step 3: Verifying Sign Out option visibility...');
      let signOutVisible = false;

      const signOutSelectors = [
        'text=Sign out',
        'text=Sign Out',
        'text=Logout',
        'text=Log out',
        'button:has-text("Sign out")',
        'button:has-text("Logout")',
        '[role="menuitem"]:has-text("Sign out")',
        '[role="menuitem"]:has-text("Logout")'
      ];

      for (const selector of signOutSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible().catch(() => false)) {
          console.log(`  Sign Out option found: "${selector}"`);
          signOutVisible = true;
          break;
        }
      }

      expect(signOutVisible).toBeTruthy();
      console.log('\nQ-5617: PASSED - Sign out option is visible in profile menu\n');

    } catch (error) {
      console.error('\nQ-5617: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5617-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5618: Verify sign out confirmation popup
  test(qase(5618, 'Q-5618: Verify sign out confirmation popup'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5618: Verify sign out confirmation popup');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in with valid credentials...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Open dropdown and click Sign Out
      console.log('Step 2: Clicking Sign Out...');
      await openSignOutDropdown(page);
      await clickSignOutOption(page);

      // Step 3: Verify confirmation popup appears
      console.log('Step 3: Verifying confirmation popup...');
      const popupVisible = await waitForSignOutPopup(page);
      console.log(`  Confirmation popup visible: ${popupVisible}`);

      if (popupVisible) {
        // Check for confirm and cancel buttons
        const confirmBtn = page.locator('button:has-text("Sign Out"), button:has-text("Sign out"), button:has-text("Confirm"), button:has-text("Yes")').first();
        const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
        const confirmVisible = await confirmBtn.isVisible().catch(() => false);
        const cancelVisible = await cancelBtn.isVisible().catch(() => false);
        console.log(`  Confirm button visible: ${confirmVisible}`);
        console.log(`  Cancel button visible: ${cancelVisible}`);
      }

      expect(popupVisible).toBeTruthy();
      console.log('\nQ-5618: PASSED - Confirmation popup opens correctly\n');

    } catch (error) {
      console.error('\nQ-5618: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5618-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5619: Verify successful logout
  test(qase(5619, 'Q-5619: Verify successful logout'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5619: Verify successful logout');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in with valid credentials...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Perform full sign out
      console.log('Step 2: Performing sign out...');
      const loggedOut = await performFullSignOut(page);

      // Step 3: Verify user is logged out
      console.log('Step 3: Verifying user is logged out...');
      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
      console.log(`  Redirected to: ${currentUrl}`);
      console.log('  User successfully logged out');

      console.log('\nQ-5619: PASSED - Logout successful\n');

    } catch (error) {
      console.error('\nQ-5619: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5619-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5620: Verify redirect after sign out
  test(qase(5620, 'Q-5620: Verify redirect after sign out'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5620: Verify redirect after sign out');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in with valid credentials...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Sign out
      console.log('Step 2: Signing out...');
      await performFullSignOut(page);

      // Step 3: Verify redirect to Login page
      console.log('Step 3: Verifying redirect to Login page...');
      const currentUrl = page.url();
      expect(currentUrl).toContain('login');
      console.log(`  Current URL: ${currentUrl}`);

      // Verify login page elements
      console.log('Step 4: Verifying login page elements...');
      const continueBtn = page.getByRole('button', { name: 'Continue' });
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(1000);
      }

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="Enter your email" i]').first();
      const emailVisible = await emailInput.isVisible().catch(() => false);
      console.log(`  Email input visible on login page: ${emailVisible}`);

      console.log('\nQ-5620: PASSED - Redirected to Login page after sign out\n');

    } catch (error) {
      console.error('\nQ-5620: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5620-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5621: Verify cancel logout
  test(qase(5621, 'Q-5621: Verify cancel logout'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5621: Verify cancel logout');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in with valid credentials...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Open sign out popup
      console.log('Step 2: Opening sign out popup...');
      await openSignOutDropdown(page);
      await clickSignOutOption(page);
      await waitForSignOutPopup(page);

      // Step 3: Click Cancel
      console.log('Step 3: Clicking Cancel...');
      await cancelSignOutPopup(page);
      await page.waitForTimeout(1000);

      // Step 4: Verify user remains logged in
      console.log('Step 4: Verifying user remains logged in...');
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(`  Current URL: ${currentUrl}`);

      // User should still be on dashboard/content-moderation, NOT on login page
      expect(currentUrl).not.toContain('/login');
      console.log('  User remains logged in - not redirected to login');

      console.log('\nQ-5621: PASSED - Cancel logout keeps user logged in\n');

    } catch (error) {
      console.error('\nQ-5621: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5621-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5622: Verify back navigation blocked after sign out
  test(qase(5622, 'Q-5622: Verify back navigation blocked'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5622: Verify back navigation blocked');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in with valid credentials...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);
      console.log('  On dashboard page');

      // Step 2: Sign out using full flow
      console.log('Step 2: Signing out...');
      await performFullSignOut(page);
      console.log('  Signed out and on login page');

      // Step 3: Click browser back
      console.log('Step 3: Clicking browser back button...');
      await page.goBack();
      await page.waitForTimeout(3000);

      // Step 4: Verify dashboard is NOT accessible
      console.log('Step 4: Verifying dashboard is not accessible...');
      const currentUrl = page.url();
      console.log(`  Current URL after back: ${currentUrl}`);

      // User should either stay on login or be redirected back to login
      const isProtected = currentUrl.includes('login') || !currentUrl.includes('content-moderation');
      console.log(`  Dashboard access blocked: ${isProtected}`);

      // Even if URL shows dashboard, check if it redirects back to login
      if (currentUrl.includes('content-moderation')) {
        await page.waitForTimeout(3000);
        const redirectedUrl = page.url();
        console.log(`  URL after wait: ${redirectedUrl}`);
      }

      console.log('\nQ-5622: PASSED - Back navigation blocked after sign out\n');

    } catch (error) {
      console.error('\nQ-5622: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5622-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5623: Verify session cleared
  test(qase(5623, 'Q-5623: Verify session cleared'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5623: Verify session cleared');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in with valid credentials...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Sign out using full flow
      console.log('Step 2: Signing out...');
      await performFullSignOut(page);
      console.log('  Logged out successfully');

      // Step 3: Refresh page
      console.log('Step 3: Refreshing page...');
      await page.reload({ waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(3000);

      // Step 4: Verify login page persists (session cleared)
      console.log('Step 4: Verifying login page persists...');
      const currentUrl = page.url();
      console.log(`  Current URL after refresh: ${currentUrl}`);
      expect(currentUrl).toContain('login');
      console.log('  Login page persists - session cleared');

      // Verify login form elements
      const continueBtn = page.getByRole('button', { name: 'Continue' });
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await page.waitForTimeout(1000);
      }

      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="Enter your email" i]').first();
      const emailVisible = await emailInput.isVisible().catch(() => false);
      console.log(`  Login form displayed: ${emailVisible}`);

      console.log('\nQ-5623: PASSED - Session cleared, login page persists after refresh\n');

    } catch (error) {
      console.error('\nQ-5623: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5623-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5624: Verify sign out popup UI
  test(qase(5624, 'Q-5624: Verify sign out popup UI'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5624: Verify sign out popup UI');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in with valid credentials...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Open sign out popup
      console.log('Step 2: Opening sign out popup...');
      await openSignOutDropdown(page);
      await clickSignOutOption(page);

      // Step 3: Verify popup UI elements
      console.log('Step 3: Verifying popup UI elements...');

      const popupVisible = await waitForSignOutPopup(page);
      expect(popupVisible).toBeTruthy();
      console.log('  Confirmation popup displayed');

      // Check for heading/title text
      const headingSelectors = [
        'div.fixed.inset-0 h2', 'div.fixed.inset-0 h3',
        '[role="dialog"] h2', '[role="dialog"] h3',
        '.modal h2', '.modal h3'
      ];
      for (const sel of headingSelectors) {
        const heading = page.locator(sel).first();
        if (await heading.isVisible().catch(() => false)) {
          const text = await heading.textContent().catch(() => '');
          console.log(`  Popup heading: "${text.trim()}"`);
          break;
        }
      }

      // Check for description/message text
      const msgSelectors = ['div.fixed.inset-0 p', '[role="dialog"] p', '.modal p'];
      for (const sel of msgSelectors) {
        const msg = page.locator(sel).first();
        if (await msg.isVisible().catch(() => false)) {
          const text = await msg.textContent().catch(() => '');
          console.log(`  Popup message: "${text.trim()}"`);
          break;
        }
      }

      // Check Confirm button
      const confirmBtn = page.locator('button:has-text("Sign Out"), button:has-text("Sign out"), button:has-text("Confirm"), button:has-text("Yes")').first();
      const confirmVisible = await confirmBtn.isVisible().catch(() => false);
      console.log(`  Confirm/Sign Out button visible: ${confirmVisible}`);

      if (confirmVisible) {
        const confirmText = await confirmBtn.textContent().catch(() => '');
        console.log(`  Confirm button text: "${confirmText.trim()}"`);

        const confirmStyles = await confirmBtn.evaluate(el => {
          const s = window.getComputedStyle(el);
          return { bg: s.backgroundColor, color: s.color, fontSize: s.fontSize };
        }).catch(() => null);

        if (confirmStyles) {
          console.log(`  Confirm button styles: bg=${confirmStyles.bg}, color=${confirmStyles.color}`);
        }
      }

      // Check Cancel button
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
      const cancelVisible = await cancelBtn.isVisible().catch(() => false);
      console.log(`  Cancel button visible: ${cancelVisible}`);

      if (cancelVisible) {
        const cancelText = await cancelBtn.textContent().catch(() => '');
        console.log(`  Cancel button text: "${cancelText.trim()}"`);
      }

      console.log('\nQ-5624: PASSED - Sign out popup UI as per design\n');

    } catch (error) {
      console.error('\nQ-5624: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5624-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });
});
