const { expect } = require('@playwright/test');
const fs = require('fs');

/**
 * Common login helper for all tests
 * Flow:
 * 1. Visit login page → Click Continue (Welcome page)
 * 2. Enter email → Click Continue (Email page)
 * 3. Go to Yopmail → Get OTP → Return to app
 * 4. Enter 6-digit OTP → Click Continue (OTP page)
 * 5. Reach admin dashboard (Content Moderation page)
 */
async function loginWithOTP(page, browser, email = 'admin.devrainyday@yopmail.com', loginUrl = 'https://dev.rainydayparents.com/login') {
  console.log('🔐 Starting login flow...');
  
  // Step 1: Visit login page and click Welcome → Continue
  console.log('📍 Step 1: Navigating to login page...');
  await page.goto(loginUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const welcomeContinueBtn = page.locator('button:has-text("Continue")').first();
  await expect(welcomeContinueBtn).toBeVisible();
  console.log('✓ Found Welcome Continue button');
  await welcomeContinueBtn.click();
  await page.waitForLoadState('networkidle');
  console.log('✓ Clicked Continue on Welcome page');

  // Step 2: Enter email and click Continue
  console.log(`📧 Step 2: Entering email "${email}"...`);
  
  // Wait for email input to appear (with longer timeout)
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ timeout: 15000 });
  await expect(emailInput).toBeVisible({ timeout: 10000 });
  console.log('✓ Email input field visible');
  
  await emailInput.fill(email);
  console.log('✓ Email entered');
  
  // After filling email, wait a bit for button to appear
  await page.waitForTimeout(1000);
  
  // Look for the Continue button - it might be near the email input or have a specific selector
  // Try finding by aria-label, role, or nearest button
  let emailContinueBtn = null;
  
  // First try: Look for button with text "Continue" that appears after email input
  const continueButtons = page.locator('button:has-text("Continue")');
  const count = await continueButtons.count();
  
  if (count >= 2) {
    emailContinueBtn = continueButtons.nth(1);
    console.log(`✓ Found ${count} buttons, using index 1`);
  } else if (count === 1) {
    // Only one button visible - might be the email's button
    emailContinueBtn = continueButtons.nth(0);
    console.log('✓ Found 1 button, using it');
  } else {
    // Fallback: look for button near the email input
    const parentForm = emailInput.locator('xpath=./ancestor::form');
    emailContinueBtn = parentForm.locator('button:visible').first();
    console.log('✓ Using button from parent form');
  }
  
  await emailContinueBtn.click({ timeout: 10000 });
  
  // Wait for page navigation and new content to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  console.log('✓ Clicked Continue on Email page');

  // Step 3: Get OTP from Yopmail
  console.log('📨 Step 3: Getting OTP from Yopmail...');
  const emailLocalPart = email.split('@')[0];
  // Allow overriding OTP source for automation: check env var or .otp file first
  let preSuppliedOtp = process.env.TEST_OTP || null;
  if (!preSuppliedOtp) {
    try {
      const fileOtp = fs.readFileSync('.otp', 'utf8').trim();
      if (fileOtp) preSuppliedOtp = fileOtp;
    } catch (e) {
      // ignore missing file
    }
  }
  if (preSuppliedOtp) {
    console.log(`  Using pre-supplied OTP from env/file: ${preSuppliedOtp}`);
  }
  // Prepare OTPr variable; prefer Yopmail retrieval first. Keep pre-supplied OTP
  // as a fallback if Yopmail fails to deliver the message.
  let otp = null;
  if (preSuppliedOtp) {
    console.log('  Pre-supplied OTP available; will use only if Yopmail fails');
  }
  let yopmailPage = null;
  
  // Only perform Yopmail navigation when we don't already have an OTP
  if (!otp) {
    // Navigate directly to the Yopmail inbox for the specified local part to reduce flakiness
    const inboxUrl = `https://yopmail.com/en/wm?login=${emailLocalPart}`;
    console.log(`✓ Opening Yopmail inbox: ${inboxUrl}`);
    yopmailPage = await browser.newPage();

    // Try navigating directly to the inbox; if the site returns an HTTP error
    // (some Yopmail endpoints can be flaky), fall back to the homepage flow.
    let pageContent = '';
    try {
      await yopmailPage.goto(inboxUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await yopmailPage.waitForTimeout(2000);
      pageContent = await yopmailPage.textContent('body').catch(() => '');
      console.log(`  Page content length: ${pageContent ? pageContent.length : 0} chars`);
      if (!pageContent || pageContent.length < 20) {
        console.log('  Inbox appears empty after direct open; reloading...');
        await yopmailPage.reload();
        await yopmailPage.waitForLoadState('domcontentloaded');
        await yopmailPage.waitForTimeout(4000);
        pageContent = await yopmailPage.textContent('body').catch(() => '');
        console.log(`  After reload, page content length: ${pageContent ? pageContent.length : 0} chars`);
      }
    } catch (e) {
      console.log(`  Direct inbox navigation failed: ${e.message}`);
      console.log('  Falling back to Yopmail homepage and using the input field.');
      await yopmailPage.goto('https://yopmail.com', { waitUntil: 'domcontentloaded' });
      await yopmailPage.waitForTimeout(2000);
      // Enter email in yopmail input and click check inbox
      const yopmailInput = yopmailPage.locator('input#login, input[name="login"]');
      if (await yopmailInput.count()) {
        await yopmailInput.fill(emailLocalPart).catch(() => {});
        console.log(`  Filled Yopmail login input with: ${emailLocalPart}`);
        const checkBtn = yopmailPage.locator('button[title*="Check Inbox"], button:has-text("Check Inbox")').first();
        if (await checkBtn.count()) {
          await checkBtn.click().catch(() => {});
          await yopmailPage.waitForLoadState('domcontentloaded');
          await yopmailPage.waitForTimeout(3000);
          pageContent = await yopmailPage.textContent('body').catch(() => '');
          console.log(`  After homepage flow, page content length: ${pageContent ? pageContent.length : 0} chars`);
        }
      }
    }
  
  // Wait for frames and email list to load; Yopmail places the inbox and mail
  // content inside frames, so query frame DOMs instead of top-level page.
  if (!otp) {
    console.log('  Waiting for Yopmail frames and email list...');
    await yopmailPage.waitForTimeout(6000);

    // Helper: find likely inbox frame
    const findInboxFrame = () => {
      return yopmailPage.frames().find(f => {
        const u = f.url() || '';
        return u.includes('/wm') || u.includes('/inbox') || u.includes('yopmail');
      });
    };

    const otpRegex = /\b(\d{4,6})\b/;
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts && !otp; attempt++) {
      // Refresh frame references each attempt
      let inboxFrame = findInboxFrame() || yopmailPage.mainFrame();

      // Common selectors for message list items inside the inbox frame
      const listSelectors = ['div.ycptlistitem', '.m2', '.m', '.listitem', 'a[href*="wm"]', 'li'];
      let emailItem = null;

      for (const sel of listSelectors) {
        try {
          const loc = inboxFrame.locator(sel).first();
          if ((await loc.count()) > 0) {
            const vis = await loc.isVisible().catch(() => false);
            if (vis) {
              emailItem = loc;
              console.log(`  ✓ Found inbox item with selector: ${sel}`);
              break;
            }
          }
        } catch (e) {
          // ignore and try next selector
        }
      }

      if (emailItem) {
        try {
          await emailItem.click();
          await yopmailPage.waitForTimeout(1500);
          console.log('  ✓ Opened email from inbox frame');

          // Mail content often loads in a separate frame (commonly named 'ifmail' or similar)
          const mailFrame = yopmailPage.frames().find(f => {
            const u = f.url() || '';
            return (u.includes('/mail') || u.includes('/ifmail') || (u.includes('yopmail') && !u.includes('/wm')));
          }) || inboxFrame;

          const pageText = await mailFrame.textContent('body').catch(() => '');
          const sample = (pageText || '').substring(0, 400).replace(/\s+/g, ' ');
          console.log(`  Email content sample: "${sample}..."`);

          const match = pageText && pageText.match(otpRegex);
          if (match && match[1].length >= 4) {
            otp = match[1];
            console.log(`✓ Found OTP: ${otp}`);
            break;
          }
        } catch (e) {
          console.log(`  Error opening/reading email: ${e.message}`);
        }
      } else {
        console.log(`  Attempt ${attempt + 1}/${maxAttempts}: Email not found in frames, retrying...`);
        // Try reloading the inbox frame to refresh content if present
        try {
          await yopmailPage.reload();
          await yopmailPage.waitForTimeout(3000);
        } catch (e) {
          // ignore reload errors
        }
      }

      if (!otp) await yopmailPage.waitForTimeout(2000);
    }
  }
  
  if (!otp) {
    await yopmailPage.screenshot({ path: 'yopmail-no-otp.png', fullPage: true });
    const finalContent = await yopmailPage.textContent().catch(() => '');
    console.log(`\n✗ Screenshot saved to yopmail-no-otp.png`);
    console.log(`  Final page content (first 500 chars): ${finalContent.substring(0, 500)}\n`);
    throw new Error('❌ OTP not found in Yopmail. Email may not have been sent. Check yopmail-no-otp.png');
  }
  
  if (yopmailPage) {
    await yopmailPage.close();
    console.log('✓ Yopmail page closed');
  }

  // Step 4: Wait for OTP page to appear and enter OTP
  console.log('🔢 Step 4: Waiting for OTP entry form...');
  
  // Wait for OTP input fields to appear on the main page
  const otpInputs = page.locator('input[maxlength="1"]');
  
  // Wait with timeout for OTP fields to be visible
  await otpInputs.first().waitFor({ timeout: 10000 }).catch(() => {
    console.log('  Note: OTP fields may already be visible');
  });
  
  // Get OTP input count
  let digitCount = await otpInputs.count();
  console.log(`✓ Found ${digitCount} OTP input fields`);
  
  if (digitCount < 4 || digitCount > 8) {
    throw new Error(`❌ Expected 4-8 OTP input fields, found ${digitCount}`);
  }
  
  // Paste OTP into the form
  console.log(`\n📋 COPYING OTP FROM YOPMAIL AND PASTING INTO LOGIN FORM`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📧 OTP found in Yopmail: ${otp}`);
  console.log(`✏️  Pasting into ${digitCount} input fields...`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  const otpDigits = otp.split('');
  for (let i = 0; i < digitCount && i < otpDigits.length; i++) {
    await otpInputs.nth(i).fill(otpDigits[i]);
    await otpInputs.nth(i).waitFor({ state: 'visible' });
    console.log(`  [${i + 1}/${digitCount}] Filled digit: ${otpDigits[i]}`);
  }
  console.log('✓ All OTP digits pasted successfully');

  // Step 5: Submit OTP
  console.log('✅ Step 5: Submitting OTP...');
  await page.waitForTimeout(1000);
  
  // Try different submission methods
  let submitted = false;
  
  // Method 1: Look for a Continue or Submit button
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();
  
  if (buttonCount > 0) {
    for (let i = buttonCount - 1; i >= 0; i--) {
      const btn = buttons.nth(i);
      const text = await btn.textContent().catch(() => '');
      const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
      
      if (text.includes('Continue') || text.includes('Submit') || ariaLabel.includes('Continue')) {
        console.log(`  Found button: "${text.trim()}"`);
        try {
          await btn.click({ timeout: 5000 });
          submitted = true;
          console.log('✓ Clicked Continue/Submit button');
          break;
        } catch (e) {
          console.log(`  Could not click button: ${e.message}`);
        }
      }
    }
  }
  
  // Method 2: If no button found, press Enter
  if (!submitted) {
    console.log('  No Continue button found, pressing Enter to submit...');
    await page.keyboard.press('Enter');
    submitted = true;
  }
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  console.log('✓ OTP submitted');

  // Verify we're logged in (check if we reach content moderation or dashboard)
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  if (currentUrl.includes('login') || currentUrl.includes('otp')) {
    throw new Error('❌ Login failed - still on login page');
  }
  
  console.log('✅ Login successful!');
  return page;
}

}

module.exports = { loginWithOTP };
