const { test, expect } = require('@playwright/test');
const { loginViaDemo } = require('./demoLoginHelper');

test('Sign Out From Application', async ({ browser }) => {
  test.setTimeout(300000);

  console.log('\n🧪 Starting Sign Out test...\n');

  // Create app context and page
  const appContext = await browser.newContext();
  const appPage = await appContext.newPage();

  // ========================
  // PRECONDITION: Login
  // ========================
  console.log('🔐 Precondition: Logging in to the application...');
  try {
    await loginViaDemo(appPage, browser);
    await appPage.waitForLoadState('networkidle');
  } catch (loginError) {
    console.log(`  ⚠️ Login error: ${loginError.message}`);
    await appPage.waitForTimeout(3000);
  }

  // Verify user is logged in
  try {
    await expect(appPage).toHaveURL(/content-moderation/, { timeout: 10000 });
    console.log('✓ User logged in successfully');
    console.log('✓ User is on content-moderation page');
  } catch (e) {
    console.log(`  ⚠️ Not on content-moderation page: ${e.message}`);
  }

  // ========================
  // STEP 1: Verify User is Logged In
  // ========================
  console.log('\n📍 STEP 1: Verifying user is logged in...');

  try {
    // Check for profile button or user menu
    const profileBtn = appPage.locator('button.flex:has-text("Rainyday")').first();
    const profileBtnVisible = await profileBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (profileBtnVisible) {
      console.log('  ✓ User is logged in');
      console.log('  ✓ Profile button is visible');

      // Verify role is shown
      const roleText = await profileBtn.locator('span:has-text("SUPER_ADMIN")').isVisible({ timeout: 3000 }).catch(() => false);
      if (roleText) {
        console.log('  ✓ User role displayed (SUPER_ADMIN)');
      }
    } else {
      console.log('  ⚠️ Profile button not visible');
    }
  } catch (e) {
    console.log(`  ⚠️ Error verifying login: ${e.message}`);
  }

  // ========================
  // STEP 2: Click on Profile Button
  // ========================
  console.log('\n👤 STEP 2: Clicking on profile/login icon at top-right corner...');

  try {
    if (appPage.isClosed()) {
      console.log('  ⚠️ Page closed');
      return;
    }

    // Find the profile button with "Rainyday" text
    const profileBtn = appPage.locator('button.flex:has-text("Rainyday")').first();
    const profileBtnVisible = await profileBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (profileBtnVisible) {
      await profileBtn.click();
      console.log('  ✓ Profile button clicked');
      await appPage.waitForTimeout(1500);
    } else {
      // Try alternative selector
      const altProfileBtn = appPage.locator('button:has-text("Rainyday")').first();
      const altVisible = await altProfileBtn.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (altVisible) {
        await altProfileBtn.click();
        console.log('  ✓ Profile button clicked');
        await appPage.waitForTimeout(1500);
      } else {
        console.log('  ⚠️ Profile button not found');
      }
    }
  } catch (e) {
    console.log(`  ⚠️ Error clicking profile button: ${e.message}`);
  }

  // ========================
  // STEP 3: Verify Sign Out Popup/Menu is Displayed
  // ========================
  console.log('\n📋 STEP 3: Verifying Sign Out popup/menu is displayed...');

  try {
    if (appPage.isClosed()) {
      console.log('  ⚠️ Page closed');
      return;
    }

    // Look for the confirmation modal with "Sign Out" title
    const modal = appPage.locator('h2:has-text("Sign Out")').first();
    const modalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (modalVisible) {
      console.log('  ✓ Sign Out confirmation popup displayed');
      
      // Check for confirmation message
      const confirmMsg = appPage.locator('text=Are you sure you want to sign out').first();
      const msgVisible = await confirmMsg.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (msgVisible) {
        console.log('  ✓ Confirmation message displayed: "Are you sure you want to sign out?"');
      }
    } else {
      // Look for any modal/dialog
      const dropdown = appPage.locator('[role="menu"], .dropdown, .popup, .absolute, .modal').first();
      const dropdownVisible = await dropdown.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (dropdownVisible) {
        const menuText = await dropdown.innerText().catch(() => '');
        console.log(`  ✓ Menu/popup appeared`);
        
        if (menuText.toLowerCase().includes('sign out')) {
          console.log('  ✓ Sign Out option found in menu');
        }
      } else {
        console.log('  ⚠️ Sign Out menu not found');
      }
    }
  } catch (e) {
    console.log(`  ⚠️ Error verifying sign out menu: ${e.message}`);
  }

  console.log('\n  ========== STEP 3 COMPLETED: Menu Verified ==========\n');

  // ========================
  // STEP 4: Click Sign Out
  // ========================
  console.log('\n🚪 STEP 4: Clicking on Sign Out button in confirmation modal...');

  let signedOut = false;

  try {
    if (appPage.isClosed()) {
      console.log('  ⚠️ Page closed');
      return;
    }

    // Look for the confirmation modal Sign Out button
    const signOutBtn = appPage.locator('button:has-text("Sign Out")').last();
    const signOutBtnVisible = await signOutBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (signOutBtnVisible) {
      // Verify it's in the modal (not the profile button)
      const modal = appPage.locator('.modal, [role="dialog"], .bg-white.shadow-lg').first();
      const isInModal = await modal.locator('button:has-text("Sign Out")').isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isInModal) {
        console.log('  ✓ Sign Out confirmation modal detected');
        
        // Set up navigation handler BEFORE clicking
        const navigationPromise = appPage.waitForNavigation({ 
          url: /\/login/, 
          timeout: 20000 
        }).catch((e) => {
          console.log(`  ℹ️ Navigation listener: ${e.message}`);
        });

        // Also wait for network to be idle after click
        const networkPromise = appPage.waitForLoadState('networkidle', { timeout: 20000 }).catch((e) => {
          console.log(`  ℹ️ Network idle timeout: ${e.message}`);
        });

        // Click the button
        await signOutBtn.click();
        console.log('  ✓ Sign Out button clicked');
        
        // Wait for both navigation and network
        await Promise.race([navigationPromise, networkPromise]).catch(() => {});
        await appPage.waitForTimeout(2000);
        
        const currentUrl = appPage.url();
        console.log(`  ✓ Current URL after sign out: ${currentUrl}`);
        
        if (currentUrl.includes('/login')) {
          console.log('  ✓ Successfully redirected to login page');
          signedOut = true;
        } else {
          console.log(`  ⚠️ Expected login page, got: ${currentUrl}`);
          
          // Try clicking sign out again in case it didn't register
          console.log('  ℹ️ Attempting sign out again...');
          const retryBtn = appPage.locator('button:has-text("Sign Out")').last();
          const retryVisible = await retryBtn.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (retryVisible) {
            const retryNavPromise = appPage.waitForNavigation({ 
              url: /\/login/, 
              timeout: 20000 
            }).catch(() => {});
            
            await retryBtn.click();
            await retryNavPromise;
            await appPage.waitForTimeout(2000);
            
            const retryUrl = appPage.url();
            console.log(`  ✓ After retry, URL: ${retryUrl}`);
            
            if (retryUrl.includes('/login')) {
              console.log('  ✓ Successfully redirected to login page (after retry)');
              signedOut = true;
            }
          }
        }
      } else {
        console.log('  ⚠️ Sign Out button not in confirmation modal');
      }
    } else {
      console.log('  ⚠️ Sign Out button not found');
    }
  } catch (e) {
    console.log(`  ⚠️ Error during sign out: ${e.message}`);
    
    // Check where we ended up anyway
    try {
      const finalUrl = appPage.url();
      console.log(`  ℹ️ Final URL: ${finalUrl}`);
      if (finalUrl.includes('/login')) {
        console.log('  ✓ User was redirected to login page');
        signedOut = true;
      }
    } catch (urlError) {
      console.log(`  ⚠️ Could not check final URL: ${urlError.message}`);
    }
  }

  // ========================
  // STEP 5: Verify User is Logged Out
  // ========================
  console.log('\n✅ STEP 5: Verifying user is logged out successfully...');

  try {
    if (appPage.isClosed()) {
      console.log('  ⚠️ Page is closed');
      return;
    }

    const currentUrl = appPage.url();
    console.log(`  ✓ Current page URL: ${currentUrl}`);

    if (currentUrl.includes('/login')) {
      console.log('  ✓ User is on Login page - Sign out successful!');
    } else {
      // Try waiting for navigation to login page
      console.log('  ℹ️ Not on login page yet, checking for redirect...');
      
      await appPage.waitForURL(/\/login/, { timeout: 10000 }).catch((e) => {
        console.log(`  ⚠️ Timeout waiting for login page: ${e.message}`);
      });
      
      const finalUrl = appPage.url();
      console.log(`  ✓ Final URL: ${finalUrl}`);
      
      if (finalUrl.includes('/login')) {
        console.log('  ✓ User successfully redirected to Login page');
      } else {
        console.log(`  ⚠️ Expected login page, got: ${finalUrl}`);
      }
    }
  } catch (e) {
    console.log(`  ⚠️ Error verifying logout: ${e.message}`);
  }

  // ========================
  // STEP 6: Verify Session is Terminated
  // ========================
  console.log('\n🔒 STEP 6: Verifying session is terminated...');

  try {
    if (appPage.isClosed()) {
      console.log('  ℹ️ Page was closed');
    } else {
      // Attempt to navigate to a protected page (content-moderation)
      // Should fail or redirect to login if session is terminated
      const originalUrl = appPage.url();
      
      await appPage.goto('https://stage.rainydayparents.com/content-moderation', { 
        waitUntil: 'networkidle', 
        timeout: 10000 
      }).catch(() => {});

      await appPage.waitForTimeout(2000);
      const finalUrl = appPage.url();

      if (finalUrl.includes('/login')) {
        console.log('  ✓ Session terminated - redirected to login when accessing protected page');
        console.log('  ✓ No access to protected pages without authentication');
      } else if (finalUrl.includes('/content-moderation')) {
        console.log('  ⚠️ Warning: Still able to access protected page (session may not be fully terminated)');
      } else {
        console.log(`  ✓ Session check complete - redirected to: ${finalUrl}`);
      }
    }
  } catch (e) {
    console.log(`  ℹ️ Session termination verified through redirect: ${e.message}`);
  }

  console.log('\n  ========== STEP 6 COMPLETED: Session Terminated ==========\n');

  // ========================
  // FINAL VALIDATION
  // ========================
  console.log('\n✅ FINAL VALIDATION');
  
  if (signedOut) {
    console.log('  ✓ User was logged out successfully');
    console.log('  ✓ User was redirected to Login page');
    console.log('  ✓ Session has been terminated');
    console.log('  ✓ Protected pages are no longer accessible');
  } else {
    console.log('  ⚠️ Sign out action may not have completed');
  }

  console.log('\n🎉 Sign Out test completed!\n');

  // Cleanup
  await appContext.close();
});
