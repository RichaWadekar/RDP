const { expect } = require('@playwright/test');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**Login helper for module specs--------
 * Login via Yopmail OTP for stage environment
 * @param {import('@playwright/test').Page} appPage - The app page to login on
 * @param {import('@playwright/test').Browser} browser - Browser instance for creating mail context
 */
async function loginViaDemo(appPage, browser) {
  console.log('🔐 Starting login via demo...\n');

  let mailContext = null;

  try {
    // ===== STEP 1: Navigate to login page =====
    console.log('📍 Step 1: Navigating to login page...');
    await appPage.goto('https://stage.rainydayparents.com/login', { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(1000);

    // ===== STEP 2: Click Continue on welcome screen =====
    console.log('✓ Step 2: Clicking Continue on welcome screen...');
    const continueBtn = appPage.getByRole('button', { name: 'Continue' });
    await continueBtn.waitFor({ timeout: 10000 });
    await continueBtn.click();
    await appPage.waitForTimeout(500);

    // ===== STEP 3: Enter email and click Continue =====
    console.log('📧 Step 3: Entering email address...');
    const emailInput = appPage.getByPlaceholder('Enter your email');
    await emailInput.waitFor({ timeout: 10000 });
    await emailInput.fill('admin.devrainyday@yopmail.com');
    console.log('✓ Email entered: admin.devrainyday@yopmail.com');

    // ===== STEP 4: Click Continue to proceed to OTP screen =====
    console.log('✓ Step 4: Clicking Continue to proceed to OTP screen...');
    await continueBtn.click();
    await appPage.waitForTimeout(2000);

    // ===== STEP 5: Open Yopmail in a separate context =====
    console.log('📬 Step 5: Opening Yopmail to fetch OTP...');
    mailContext = await browser.newContext();
    const mailPage = await mailContext.newPage();

    try {
      await mailPage.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
      console.log('⚠️ Yopmail navigation timeout (continuing with retry)');
    }
    await mailPage.waitForTimeout(500);

    // ===== STEP 6: Navigate to inbox =====
    console.log('✓ Step 6: Entering inbox on Yopmail...');
    const localPart = 'admin.devrainyday';
    await mailPage.fill('#login', localPart);
    await mailPage.press('#login', 'Enter');
    await mailPage.waitForTimeout(2000);

    // ===== STEP 7: Fetch OTP from email with retries =====
    console.log('🔍 Step 7: Searching for verification email and OTP...');
    let otp = null;
    const maxRetries = 12;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Wait for inbox iframe
        await mailPage.waitForSelector('#ifinbox', { timeout: 5000 });
        const inboxFrame = mailPage.frameLocator('#ifinbox');
        const firstMessage = inboxFrame.locator('div.m, .m').first();

        if (await firstMessage.count() > 0) {
          await firstMessage.click().catch(() => {});
          await mailPage.waitForTimeout(1500);
        }

        // Wait for mail iframe and extract body
        await mailPage.waitForSelector('#ifmail', { timeout: 5000 });
        const mailFrame = mailPage.frameLocator('#ifmail');
        await mailFrame.locator('body').waitFor({ timeout: 5000 });
        const bodyText = await mailFrame.locator('body').innerText().catch(() => '');

        // Extract 6-digit OTP
        const match = bodyText.match(/your verification code is[:\s]*([0-9]{6})/i) || bodyText.match(/(\d{6})/);
        if (match) {
          otp = match[1];
          console.log(`✓ OTP found: ${otp}`);
          break;
        }
      } catch (e) {
        // Silently retry
      }

      if (attempt < maxRetries - 1) {
        console.log(`⏳ Retrying... (attempt ${attempt + 1}/${maxRetries})`);
        await mailPage.reload({ waitUntil: 'networkidle' }).catch(() => {});
        await sleep(5000);
      }
    }

    await mailContext.close();
    mailContext = null;

    if (!otp) {
      throw new Error('Failed to retrieve OTP from Yopmail after multiple attempts');
    }

    // ===== STEP 8: Return to app and enter OTP =====
    console.log('\n📲 Step 8: Returning to app and entering OTP...');

    if (appPage.isClosed()) {
      throw new Error('App page was closed unexpectedly');
    }

    // Try to fill individual OTP input fields
    const otpInputs = await appPage.locator('input[maxlength="1"], input[name*="otp"], input[inputmode="numeric"], input[type="tel"]').elementHandles();

    if (otpInputs.length >= 6) {
      console.log(`✓ Found ${otpInputs.length} OTP input fields`);
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].fill(otp[i]).catch(() => {});
      }
      console.log('✓ OTP entered into fields');
    } else {
      // Fallback: single OTP field
      const singleOtpInput = appPage.locator('input[name*="otp"], input.otp, input[id*="otp"], input[type="text"]').first();
      await singleOtpInput.fill(otp).catch(() => {});
      console.log('✓ OTP entered into single field');
    }

    // ===== STEP 9: OTP entered; the form auto-verifies after last digit =====
    console.log('✓ Step 9: OTP entered — awaiting auto-verification');
    await appPage.waitForTimeout(1500);

    // ===== STEP 10: Verify login success =====
    console.log('✓ Step 10: Verifying login success...');

    // Wait for redirect to content-moderation page
    const expectedUrl = 'https://stage.rainydayparents.com/content-moderation';
    const pollInterval = 500;
    const maxPolls = 30;
    let found = false;

    for (let i = 0; i < maxPolls; i++) {
      try {
        const u = appPage.url();
        if (u && (u === expectedUrl || u.startsWith(expectedUrl + '/') || u.startsWith(expectedUrl + '?'))) {
          found = true;
          console.log(`✓ Detected content-moderation URL: ${u}`);
          break;
        }
      } catch (e) {
        // ignore
      }
      await sleep(pollInterval);
    }

    if (found) {
      console.log('✅ Login completed successfully');
    } else {
      console.log('⚠️ Expected content-moderation URL not detected, but continuing...');
    }

  } catch (error) {
    console.error('❌ Login failed:', error.message);
    if (mailContext) {
      await mailContext.close().catch(() => {});
    }
    throw error;
  }
}

module.exports = { loginViaDemo };
