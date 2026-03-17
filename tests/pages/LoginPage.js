const { BasePage } = require('./BasePage');
const { sleep } = require('../utils/helpers');

/**
 * LoginPage - Handles login functionality with OTP verification
 */
class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.emailInput = page.getByPlaceholder('Enter your email');
    this.otpInputs = page.locator('input[maxlength="1"], input[name*="otp"], input[inputmode="numeric"], input[type="tel"]');
    this.singleOtpInput = page.locator('input[name*="otp"], input.otp, input[id*="otp"], input[type="text"]').first();
  }

  /**
   * Navigate to login page
   */
  async goToLogin() {
    await this.navigate('/login');
    await this.wait(1000);
    console.log('    Navigated to login page');
  }

  /**
   * Click continue button on welcome screen
   */
  async clickContinue() {
    await this.continueButton.waitFor({ timeout: 10000 });
    await this.continueButton.click();
    await this.wait(500);
    console.log('    Clicked Continue button');
  }

  /**
   * Enter email address
   * @param {string} email
   */
  async enterEmail(email) {
    await this.emailInput.waitFor({ timeout: 10000 });
    await this.emailInput.fill(email);
    console.log(`    Email entered: ${email}`);
  }

  /**
   * Enter OTP code
   * @param {string} otp - 6 digit OTP code
   */
  async enterOtp(otp) {
    const otpInputs = await this.otpInputs.elementHandles();

    if (otpInputs.length >= 6) {
      console.log(`    Found ${otpInputs.length} OTP input fields`);
      for (let i = 0; i < 6; i++) {
        await otpInputs[i].fill(otp[i]).catch(() => {});
      }
      console.log('    OTP entered into fields');
    } else {
      await this.singleOtpInput.fill(otp).catch(() => {});
      console.log('    OTP entered into single field');
    }
    await this.wait(1500);
  }

  /**
   * Fetch OTP from Yopmail
   * @param {import('@playwright/test').Browser} browser
   * @param {string} inbox - Yopmail inbox name
   * @returns {Promise<string|null>}
   */
  async fetchOtpFromYopmail(browser, inbox) {
    let mailContext = null;
    let otp = null;

    try {
      console.log('    Opening Yopmail to fetch OTP...');
      mailContext = await browser.newContext();
      const mailPage = await mailContext.newPage();

      try {
        await mailPage.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch {
        console.log('    Yopmail navigation timeout (continuing with retry)');
      }
      await mailPage.waitForTimeout(500);

      // Navigate to inbox
      await mailPage.fill('#login', inbox);
      await mailPage.press('#login', 'Enter');
      await mailPage.waitForTimeout(2000);

      // Fetch OTP with retries
      const maxRetries = 12;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          await mailPage.waitForSelector('#ifinbox', { timeout: 5000 });
          const inboxFrame = mailPage.frameLocator('#ifinbox');
          const firstMessage = inboxFrame.locator('div.m, .m').first();

          if (await firstMessage.count() > 0) {
            await firstMessage.click().catch(() => {});
            await mailPage.waitForTimeout(1500);
          }

          await mailPage.waitForSelector('#ifmail', { timeout: 5000 });
          const mailFrame = mailPage.frameLocator('#ifmail');
          await mailFrame.locator('body').waitFor({ timeout: 5000 });
          const bodyText = await mailFrame.locator('body').innerText().catch(() => '');

          const match = bodyText.match(/your verification code is[:\s]*([0-9]{6})/i) || bodyText.match(/(\d{6})/);
          if (match) {
            otp = match[1];
            console.log(`    OTP found: ${otp}`);
            break;
          }
        } catch {
          // Silently retry
        }

        if (attempt < maxRetries - 1) {
          console.log(`    Retrying... (attempt ${attempt + 1}/${maxRetries})`);
          await mailPage.reload({ waitUntil: 'networkidle' }).catch(() => {});
          await sleep(5000);
        }
      }

      await mailContext.close();
      return otp;

    } catch (error) {
      console.error('    Error fetching OTP:', error.message);
      if (mailContext) {
        await mailContext.close().catch(() => {});
      }
      return null;
    }
  }

  /**
   * Complete login process
   * @param {import('@playwright/test').Browser} browser
   * @param {string} email
   * @param {string} yopmailInbox
   */
  async login(browser, email, yopmailInbox) {
    console.log('\n  Starting login process...');

    // Navigate to login
    await this.goToLogin();

    // Click continue on welcome screen
    await this.clickContinue();

    // Enter email
    await this.enterEmail(email);

    // Click continue to OTP screen
    await this.clickContinue();
    await this.wait(2000);

    // Fetch OTP from Yopmail
    const otp = await this.fetchOtpFromYopmail(browser, yopmailInbox);
    if (!otp) {
      throw new Error('Failed to retrieve OTP from Yopmail');
    }

    // Enter OTP
    await this.enterOtp(otp);

    // Wait for redirect to content-moderation
    console.log('    Verifying login success...');
    const expectedUrl = `${this.baseUrl}/content-moderation`;
    const maxPolls = 30;
    let found = false;

    for (let i = 0; i < maxPolls; i++) {
      const url = this.getUrl();
      if (url && (url === expectedUrl || url.startsWith(expectedUrl + '/') || url.startsWith(expectedUrl + '?'))) {
        found = true;
        console.log(`    Detected content-moderation URL: ${url}`);
        break;
      }
      await sleep(500);
    }

    if (found) {
      console.log('  Login completed successfully\n');
    } else {
      console.log('  Expected content-moderation URL not detected, but continuing...\n');
    }
  }

  /**
   * Verify user is logged in
   */
  async verifyLoggedIn() {
    const url = this.getUrl();
    return url.includes('/content-moderation') || !url.includes('/login');
  }
}

module.exports = { LoginPage };
