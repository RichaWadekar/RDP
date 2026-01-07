const { expect } = require('@playwright/test');

/**
 * Perform login via Yopmail OTP. If `options.context` is provided, the login will run
 * inside that context (useful to preserve storageState). The helper will only close
 * contexts it creates itself — it will not close a caller-provided `context`.
 */
async function loginWithYopmail(browser, email = 'admin.devrainyday@yopmail.com', appUrl = 'https://dev.rainydayparents.com/login', options = {}) {
  const useProvidedContext = !!options.context;
  const appContext = useProvidedContext ? options.context : await browser.newContext();
  const emailContext = options.emailContext || await browser.newContext();
  const appPage = options.appPage || await appContext.newPage();
  const emailPage = await emailContext.newPage();

  try {
    const emailLocalPart = email.split('@')[0];
    await appPage.goto(appUrl, { waitUntil: 'networkidle', timeout: 30000 });

    const continueBtn = appPage.locator('button:has-text("Continue")', { exact: true }).first();
    if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueBtn.click();
      await appPage.waitForLoadState('networkidle');
    }

    const emailInput = appPage.locator('input[type="email"]').first();
    await emailInput.fill(email);
    const continueBtn2 = appPage.locator('button:has-text("Continue")').first();
    await continueBtn2.click();
    await appPage.waitForLoadState('networkidle');

    await emailPage.goto('https://yopmail.com', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(e => {
      console.log('⚠ Yopmail navigation slow:', e.message);
    });
    await emailPage.waitForTimeout(3000);
    
    // Yopmail may take time to load, retry finding the login input
    let loginReady = false;
    for (let i = 0; i < 5; i++) {
      try {
        const yopmailInput = emailPage.locator('input[id="login"]');
        if (await yopmailInput.count() > 0) { loginReady = true; break; }
      } catch (e) {}
      await emailPage.waitForTimeout(1500);
    }
    if (!loginReady) throw new Error('Yopmail login input not found after retries');
    
    const yopmailInput = emailPage.locator('input[id="login"]');
    await yopmailInput.fill(emailLocalPart);
    
    // Find Check Inbox button with retry
    let checkBtn = null;
    for (let i = 0; i < 5; i++) {
      try {
        const btn = emailPage.locator('button:has-text("Check Inbox")').first();
        if (await btn.count() > 0) { checkBtn = btn; break; }
      } catch (e) {
        console.log(`  Attempt ${i + 1}: Check Inbox not found, retrying...`);
      }
      await emailPage.waitForTimeout(1500);
    }
    if (!checkBtn) throw new Error('Check Inbox button not found on yopmail');
    
    await checkBtn.click();
    await emailPage.waitForLoadState('networkidle', { timeout: 60000 }).catch(e => {
      console.log('⚠ Yopmail inbox slow:', e.message);
    });

    // Yopmail sometimes uses different iframe ids/names; search frames for OTP text.
    const otpRegex = /\b(\d{4,6})\b/;
    let otp = null;
    const maxAttempts = 15; // ~37s with 2500ms interval
    for (let attempt = 0; attempt < maxAttempts && !otp; attempt++) {
      console.log(`[OTP Extraction] Attempt ${attempt + 1}/${maxAttempts}`);
      // Try main page content first
      const mainText = await emailPage.textContent().catch(() => null);
      if (mainText) {
        const m = mainText.match(otpRegex);
        if (m) { otp = m[1]; console.log('✓ Found OTP in main page:', otp); break; }
      }
      
      // Try all frames
      const frames = emailPage.frames();
      for (const f of frames) {
        try {
          const txt = await f.textContent().catch(() => null);
          if (!txt) continue;
          const m = txt.match(otpRegex);
          if (m) { otp = m[1]; console.log('✓ Found OTP in frame:', otp); break; }
        } catch (e) {
          // ignore frame errors
        }
      }
      
      if (!otp) {
        console.log(`  No OTP found yet, waiting 2.5s...`);
        await emailPage.waitForTimeout(2500);
      }
    }
    if (!otp) throw new Error('OTP not found in yopmail message after retries');

    const otpInputs = appPage.locator('input[name*="otp"], input[placeholder*="OTP"], input[type="text"], input[id*="otp"]');
    const inputCount = await otpInputs.count();
    if (inputCount > 0) {
      const digits = otp.split('');
      for (let i = 0; i < digits.length && i < inputCount; i++) {
        await otpInputs.nth(i).fill(digits[i]);
      }
    } else {
      const single = appPage.locator('input[placeholder*="OTP"], input[placeholder*="Code"]').first();
      await single.fill(otp);
    }

    const loginBtn = appPage.locator('button:has-text("Login"), button:has-text("Sign In"), button:has-text("Submit")').first();
    await loginBtn.click();
    await appPage.waitForLoadState('networkidle');

    const url = appPage.url();
    expect(url).not.toContain('login');

    return { appContext, appPage, emailContext, emailPage };
  } catch (err) {
    await appPage.screenshot({ path: 'test-results/login-helper-failure.png' }).catch(() => {});
    if (!useProvidedContext) await appContext.close().catch(() => {});
    if (!options.emailContext) await emailContext.close().catch(() => {});
    throw err;
  }
}

module.exports = { loginWithYopmail };

