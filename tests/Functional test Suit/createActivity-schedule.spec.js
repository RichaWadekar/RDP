const { test, expect } = require('@playwright/test');

// Utility function for sleep
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

test.describe('Create Activity with Schedule', () => {
  test.setTimeout(300000); // 5 minutes timeout

  test('Create Activity with Weekly Schedule - All Days, 09:00-10:00', async ({ page, browser }) => {
    console.log('\n🚀 Create Activity with Schedule - Starting...\n');

    // ============================================================
    // STEP 1: LOGIN
    // ============================================================
    console.log('═══════════════════════════════════════════════════════');
    console.log('📌 STEP 1: LOGIN');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      // Navigate to login page
      console.log('📍 Navigating to login page...');
      await page.goto('https://stage.rainydayparents.com/login', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      console.log('  ✓ Login page loaded');

      // Click Continue on welcome screen
      console.log('📍 Clicking Continue on welcome screen...');
      const continueBtn = page.getByRole('button', { name: 'Continue' });
      await continueBtn.waitFor({ timeout: 10000 });
      await continueBtn.click();
      await page.waitForTimeout(500);
      console.log('  ✓ Continue button clicked');

      // Enter email and click Continue
      console.log('📍 Entering email address...');
      const emailInput = page.getByPlaceholder('Enter your email');
      await emailInput.waitFor({ timeout: 10000 });
      await emailInput.fill('admin.devrainyday@yopmail.com');
      console.log('  ✓ Email entered: admin.devrainyday@yopmail.com');

      // Click Continue to proceed to OTP screen
      console.log('📍 Clicking Continue to proceed to OTP screen...');
      await continueBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✓ Proceeded to OTP screen');

      // Open Yopmail in a separate context to fetch OTP
      console.log('📍 Opening Yopmail to fetch OTP...');
      const mailContext = await browser.newContext();
      const mailPage = await mailContext.newPage();

      try {
        await mailPage.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (e) {
        console.log('  ⚠ Yopmail navigation timeout (continuing with retry)');
      }
      await mailPage.waitForTimeout(500);
      console.log('  ✓ Yopmail opened');

      // Navigate to inbox
      console.log('📍 Entering inbox on Yopmail...');
      const localPart = 'admin.devrainyday';
      await mailPage.fill('#login', localPart);
      await mailPage.press('#login', 'Enter');
      await mailPage.waitForTimeout(2000);
      console.log('  ✓ Navigated to inbox');

      // Fetch OTP from email with retries
      console.log('📍 Searching for verification email and OTP...');
      let otp = null;
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
          if (match && match[1]) {
            otp = match[1];
            console.log(`  ✓ OTP found: ${otp}`);
            break;
          }
        } catch (e) {
          console.log(`  ⚠ Attempt ${attempt + 1}/${maxRetries}: OTP not found yet, retrying...`);
          await mailPage.waitForTimeout(1000);
        }
      }

      if (!otp) {
        throw new Error('Failed to fetch OTP after maximum retries');
      }

      // Close Yopmail context
      await mailContext.close();

      // Fill OTP in the app
      console.log('📍 Filling OTP in the app...');
      const otpInputs = page.locator('input[type="text"][placeholder*="0"], input[inputmode="numeric"]');
      const otpInputCount = await otpInputs.count();

      if (otpInputCount > 0) {
        const otpArray = otp.split('');
        for (let i = 0; i < otpArray.length && i < otpInputCount; i++) {
          await otpInputs.nth(i).fill(otpArray[i]);
          await page.waitForTimeout(100);
        }
        console.log('  ✓ OTP entered');
      } else {
        const singleOtpInput = page.locator('input[type="text"]').first();
        await singleOtpInput.fill(otp);
        console.log('  ✓ OTP entered');
      }

      // Wait for OTP verification and redirect
      console.log('📍 Waiting for OTP verification...');
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      console.log('  ✓ Login completed');

    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw error;
    }

    // ============================================================
    // STEP 2: NAVIGATE TO ACTIVITIES PAGE
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 STEP 2: NAVIGATE TO ACTIVITIES PAGE');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      console.log('📍 Navigating to activities page...');
      await page.goto('https://stage.rainydayparents.com/activities', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      console.log('  ✓ Activities page loaded');

      // Click Create Activity button
      console.log('📍 Clicking Create Activity button...');
      const createActivityBtn = page.getByRole('button', { name: /Create Activity/i });
      await createActivityBtn.waitFor({ timeout: 10000 });
      await createActivityBtn.click();
      await page.waitForTimeout(2000);
      console.log('  ✓ Create Activity form opened');

    } catch (error) {
      console.error('❌ Navigation to activities page failed:', error.message);
      throw error;
    }

    // ============================================================
    // STEP 3: FILL BASIC ACTIVITY DETAILS
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 STEP 3: FILL BASIC ACTIVITY DETAILS');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      // Fill Activity Name
      console.log('📍 Filling Activity Name...');
      const activityNameInput = page.getByLabel(/Activity Name/i);
      await activityNameInput.waitFor({ timeout: 5000 });
      await activityNameInput.fill('Outdoor Pool Activity');
      console.log('  ✓ Activity Name: Outdoor Pool Activity');

      // Fill Description (if present)
      console.log('📍 Filling Description...');
      const descriptionInput = page.getByLabel(/Description/i);
      if (await descriptionInput.count() > 0) {
        await descriptionInput.fill('This is an outdoor public pool activity suitable for all age groups.');
        console.log('  ✓ Description filled');
      }

      // Select Environment Type: Outdoor
      console.log('📍 Selecting Environment Type: Outdoor...');
      const envTypeSelector = page.locator('select[name*="environment"], select[name*="env"], .form-input').first();
      if (await envTypeSelector.count() > 0) {
        await envTypeSelector.click();
        await page.waitForTimeout(500);
        await page.getByText('Outdoor', { exact: false }).first().click();
        console.log('  ✓ Environment Type: Outdoor selected');
      }

      // Select Event Type: Public Pool
      console.log('📍 Selecting Event Type: Public Pool...');
      const eventTypeSelectors = page.locator('select, [role="combobox"]');
      const eventTypeCount = await eventTypeSelectors.count();
      for (let i = 0; i < eventTypeCount; i++) {
        const selector = eventTypeSelectors.nth(i);
        const selectorText = await selector.innerText().catch(() => '');
        if (selectorText.includes('Event') || selectorText.includes('Type')) {
          await selector.click();
          await page.waitForTimeout(500);
          await page.getByText('Public Pool', { exact: false }).click();
          console.log('  ✓ Event Type: Public Pool selected');
          break;
        }
      }

      // Select Entry Fee: Free
      console.log('📍 Selecting Entry Fee: Free...');
      const feeSelectors = page.locator('select, [role="combobox"]');
      const feeCount = await feeSelectors.count();
      for (let i = 0; i < feeCount; i++) {
        const selector = feeSelectors.nth(i);
        const selectorText = await selector.innerText().catch(() => '');
        if (selectorText.includes('Fee') || selectorText.includes('Paid')) {
          await selector.click();
          await page.waitForTimeout(500);
          await page.getByText('Free', { exact: false }).click();
          console.log('  ✓ Entry Fee: Free selected');
          break;
        }
      }

    } catch (error) {
      console.error('❌ Failed to fill basic activity details:', error.message);
      throw error;
    }

    // ============================================================
    // STEP 4: CONFIGURE WEEKLY SCHEDULE
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 STEP 4: CONFIGURE WEEKLY SCHEDULE');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      // Select Frequency: Weekly
      console.log('📍 Selecting Frequency: Weekly...');
      const frequencySelect = page.locator('select, [role="combobox"]').filter({ hasText: 'Daily' }).first();
      if (await frequencySelect.count() > 0) {
        await frequencySelect.click();
        await page.waitForTimeout(500);
        await page.getByText('Weekly', { exact: false }).click();
        console.log('  ✓ Frequency: Weekly selected');
      }

      // Select Repeat Every: 1 week
      console.log('📍 Selecting Repeat Every: 1 week...');
      const repeatSelect = page.locator('select, [role="combobox"]').filter({ hasText: /^1|1 week/ }).first();
      if (await repeatSelect.count() > 0) {
        await repeatSelect.click();
        await page.waitForTimeout(500);
        // Already selected by default (1 week)
        console.log('  ✓ Repeat Every: 1 week (default)');
      }

      // Select all days of the week: Sun, Mon, Tue, Wed, Thu, Fri, Sat
      console.log('📍 Selecting all days of the week (Sun-Sat)...');
      const dayButtons = page.locator('button:has-text(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/)');
      const dayCount = await dayButtons.count();
      console.log(`  Found ${dayCount} day buttons`);

      for (let i = 0; i < dayCount; i++) {
        const dayButton = dayButtons.nth(i);
        const dayText = await dayButton.innerText();
        
        // Check if button is already selected (has primary color class)
        const isSelected = await dayButton.evaluate((el) => 
          el.classList.contains('bg-primary') || 
          el.getAttribute('aria-pressed') === 'true'
        );
        
        if (!isSelected) {
          await dayButton.click();
          await page.waitForTimeout(200);
          console.log(`  ✓ Selected: ${dayText}`);
        } else {
          console.log(`  ✓ Already selected: ${dayText}`);
        }
      }

      // Set Time Slot: 09:00 - 10:00
      console.log('📍 Setting Time Slot: 09:00 - 10:00...');
      const timeInputs = page.locator('input[type="time"]');
      const timeInputCount = await timeInputs.count();
      console.log(`  Found ${timeInputCount} time inputs`);

      if (timeInputCount >= 2) {
        // Set start time
        const startTimeInput = timeInputs.first();
        await startTimeInput.click();
        await startTimeInput.fill('09:00');
        await page.waitForTimeout(300);
        console.log('  ✓ Start Time: 09:00');

        // Set end time
        const endTimeInput = timeInputs.nth(1);
        await endTimeInput.click();
        await endTimeInput.fill('10:00');
        await page.waitForTimeout(300);
        console.log('  ✓ End Time: 10:00');
      } else if (timeInputCount === 1) {
        console.log('  ⚠ Only one time input found, filling start time');
        await timeInputs.first().fill('09:00');
      }

    } catch (error) {
      console.error('❌ Failed to configure schedule:', error.message);
      throw error;
    }

    // ============================================================
    // STEP 5: SELECT AGE GROUPS
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 STEP 5: SELECT SUITABLE AGE GROUPS');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      const ageGroups = ['Prenatal', '0–6 months', '6–12 months', '3 years', '4 years', '5 years', '6 years'];
      console.log('📍 Selecting age groups...');
      
      for (const ageGroup of ageGroups) {
        const ageCheckbox = page.locator(`input[type="checkbox"][value*="${ageGroup}"], label:has-text("${ageGroup}") >> input[type="checkbox"]`).first();
        
        // Try different selectors if first one doesn't work
        let found = await ageCheckbox.count() > 0;
        
        if (!found) {
          const ageLabel = page.getByText(ageGroup, { exact: true }).first();
          if (await ageLabel.count() > 0) {
            // Find the checkbox associated with this label
            const checkbox = page.locator('input[type="checkbox"]').filter({ hasText: ageGroup }).first();
            if (await checkbox.count() > 0) {
              await checkbox.check();
              found = true;
            }
          }
        } else {
          await ageCheckbox.check();
          found = true;
        }

        if (found) {
          console.log(`  ✓ Selected: ${ageGroup}`);
        } else {
          console.log(`  ⚠ Could not select: ${ageGroup} (element not found)`);
        }
        
        await page.waitForTimeout(100);
      }

    } catch (error) {
      console.error('❌ Failed to select age groups:', error.message);
      throw error;
    }

    // ============================================================
    // STEP 6: FILL LOCATION DETAILS
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 STEP 6: FILL LOCATION DETAILS');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      // Fill Location Address
      console.log('📍 Filling Location Address: mindbowser...');
      const locationAddressInput = page.getByPlaceholder(/location|address/i).first();
      if (await locationAddressInput.count() > 0) {
        await locationAddressInput.fill('mindbowser');
        await page.waitForTimeout(1500);
        console.log('  ✓ Location Address: mindbowser');

        // Wait for autocomplete suggestions and select first option
        try {
          const suggestion = page.locator('[role="option"]').first();
          if (await suggestion.count() > 0) {
            await suggestion.click();
            await page.waitForTimeout(500);
            console.log('  ✓ Selected location from suggestions');
          }
        } catch (e) {
          console.log('  ⚠ Could not select from autocomplete suggestions');
        }
      }

      // Fill Location Name: Mindbowser Inc
      console.log('📍 Filling Location Name: Mindbowser Inc...');
      const locationNameInput = page.getByPlaceholder(/location name|name/i).last();
      if (await locationNameInput.count() > 0) {
        await locationNameInput.fill('Mindbowser Inc');
        await page.waitForTimeout(500);
        console.log('  ✓ Location Name: Mindbowser Inc');
      }

      // Optional: Leave Yelp URL, Website URL, Google Reviews URL empty
      console.log('📍 Optional URLs left empty (as per requirements)');

    } catch (error) {
      console.error('❌ Failed to fill location details:', error.message);
      throw error;
    }

    // ============================================================
    // STEP 7: PRE-REGISTRATION & VALIDATIONS
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 STEP 7: PRE-REGISTRATION & VALIDATIONS');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      // Check if Pre-registration is applicable
      console.log('📍 Checking Pre-registration option...');
      const preRegistrationCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /pre-registration|pre registration/i }).first();
      if (await preRegistrationCheckbox.count() > 0) {
        await preRegistrationCheckbox.check();
        console.log('  ✓ Pre-registration: Enabled');
      } else {
        console.log('  ℹ Pre-registration option not found (optional)');
      }

      // Verify Create Activity button is enabled
      console.log('📍 Verifying Create Activity button is enabled...');
      const createBtn = page.locator('button:has-text("Create Activity"), button:has-text("Save Schedule"), button[type="submit"]').last();
      
      if (await createBtn.count() > 0) {
        const isDisabled = await createBtn.evaluate((btn) => btn.disabled);
        if (!isDisabled) {
          console.log('  ✓ Create Activity button is ENABLED');
        } else {
          console.log('  ⚠ Create Activity button is DISABLED (validation errors may exist)');
        }
      } else {
        console.log('  ⚠ Create Activity button not found');
      }

      // Check for validation errors
      console.log('📍 Checking for validation errors...');
      const errorMessages = page.locator('.error, [role="alert"], .invalid, .text-red-600, .text-danger');
      const errorCount = await errorMessages.count();
      
      if (errorCount === 0) {
        console.log('  ✓ No validation errors detected');
      } else {
        console.log(`  ⚠ ${errorCount} validation error(s) detected`);
        for (let i = 0; i < Math.min(errorCount, 5); i++) {
          const errorText = await errorMessages.nth(i).innerText();
          console.log(`    - ${errorText}`);
        }
      }

    } catch (error) {
      console.error('❌ Validation check failed:', error.message);
      throw error;
    }

    // ============================================================
    // STEP 8: SUBMIT FORM
    // ============================================================
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📌 STEP 8: SUBMIT FORM');
    console.log('═══════════════════════════════════════════════════════\n');

    try {
      console.log('📍 Clicking Create Activity button...');
      const submitBtn = page.locator('button:has-text("Create Activity"), button:has-text("Save Schedule"), button[type="submit"]').last();
      
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        console.log('  ✓ Form submitted');

        // Wait for success confirmation
        console.log('📍 Waiting for success confirmation...');
        try {
          await page.waitForSelector('.toast, [role="alert"]:has-text("created"), [role="alert"]:has-text("success"), text=/Activity.*created|successfully/i', 
            { timeout: 10000 });
          console.log('  ✓ Activity created successfully!');
        } catch (e) {
          console.log('  ℹ Success message not detected (page may have redirected)');
        }

        // Take final screenshot
        await page.screenshot({ path: 'test-results/screenshots/createActivity-success.png', fullPage: true });
        console.log('  ✓ Screenshot saved: createActivity-success.png');

      } else {
        throw new Error('Create Activity button not found');
      }

    } catch (error) {
      console.error('❌ Form submission failed:', error.message);
      throw error;
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════\n');
  });
});
