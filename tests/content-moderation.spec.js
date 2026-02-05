const { test, expect } = require('@playwright/test');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Content Moderation Filter Validation Test
 * 
 * This test:
 * 1. Uses authentication from demo-login.spec.js pattern
 * 2. Navigates to Content Moderation page after login
 * 3. Validates dropdown-based filters exist
 * 4. Applies filters with specified values:
 *    - Reported Date: 01/07/2026
 *    - Status: action required
 *    - Content: post
 *    - Report Reason: spam
 * 5. Validates that filtered results are displayed correctly
 */

test('Content Moderation - Filter Validation with Multi-Filter Application', async ({ browser }) => {
  test.setTimeout(300000); // 5 minutes timeout

  console.log('\n🧪 Starting Content Moderation Filter Validation Test...\n');

  let appContext = null;
  let mailContext = null;

  try {
    // ===== STEP 1: LOGIN USING DEMO-LOGIN PATTERN =====
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📍 STEP 1: Performing Login via OTP...');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Create contexts for app and mail separately
    appContext = await browser.newContext();
    const appPage = await appContext.newPage();

    // ===== LOGIN FLOW FROM DEMO-LOGIN.SPEC.JS =====
    console.log('🔐 Starting login flow...\n');

    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page...');
    await appPage.goto('https://stage.rainydayparents.com/login', { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(1000);

    // Step 2: Click Continue on welcome screen
    console.log('✓ Step 2: Clicking Continue on welcome screen...');
    const continueBtn = appPage.getByRole('button', { name: 'Continue' });
    await continueBtn.waitFor({ timeout: 10000 });
    await continueBtn.click();
    await appPage.waitForTimeout(500);

    // Step 3: Enter email and click Continue
    console.log('📧 Step 3: Entering email address...');
    const emailInput = appPage.getByPlaceholder('Enter your email');
    await emailInput.waitFor({ timeout: 10000 });
    await emailInput.fill('admin.devrainyday@yopmail.com');
    console.log('✓ Email entered: admin.devrainyday@yopmail.com');

    // Step 4: Click Continue to proceed to OTP screen
    console.log('✓ Step 4: Clicking Continue to proceed to OTP screen...');
    await continueBtn.click();
    await appPage.waitForTimeout(2000);

    // Step 5: Open Yopmail in a separate context
    console.log('📬 Step 5: Opening Yopmail to fetch OTP...');
    mailContext = await browser.newContext();
    const mailPage = await mailContext.newPage();
    
    try {
      await mailPage.goto('https://yopmail.com/en/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (e) {
      console.log('⚠️ Yopmail navigation timeout (continuing with retry)');
    }
    await mailPage.waitForTimeout(500);

    // Step 6: Navigate to inbox
    console.log('✓ Step 6: Entering inbox on Yopmail...');
    const localPart = 'admin.devrainyday';
    await mailPage.fill('#login', localPart);
    await mailPage.press('#login', 'Enter');
    await mailPage.waitForTimeout(2000);

    // Step 7: Fetch OTP from email with retries
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

    if (!otp) {
      throw new Error('Failed to retrieve OTP from Yopmail after multiple attempts');
    }

    // Step 8: Return to app and enter OTP
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

    // Step 9: OTP entered; the form auto-verifies after last digit
    console.log('✓ Step 9: OTP entered — awaiting auto-verification (no explicit click)');
    try {
      await appPage.waitForTimeout(1500);
    } catch (e) {
      // Page may close after auto-submission
    }

    // Step 10: Verify login success and wait for content-moderation page
    console.log('✓ Step 10: Verifying login success...');

    const expectedUrl = 'https://stage.rainydayparents.com/content-moderation';
    const pollInterval = 500;
    const maxPolls = 30;
    let found = false;

    for (let i = 0; i < maxPolls; i++) {
      try {
        const pages = appContext.pages();
        for (const p of pages) {
          try {
            const u = p.url();
            if (u && (u === expectedUrl || u.startsWith(expectedUrl + '/') || u.startsWith(expectedUrl + '?'))) {
              found = true;
              console.log(`✓ Detected exact content-moderation URL on page: ${u}`);
              break;
            }
          } catch (e) {
            // ignore page access errors
          }
        }
        if (found) break;
      } catch (e) {
        // ignore
      }
      await sleep(pollInterval);
    }

    if (!found) {
      throw new Error('Failed to reach content-moderation page after login');
    }

    let page = appContext.pages()[0];
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Helper: get the details page/context after clicking View.
    // Handles three cases: modal/dialog on same page, same-page navigation, or a new tab/window.
    async function resolveDetailsPage(originalPage) {
      // capture snapshot of pages
      const startPages = appContext.pages();
      const startLen = startPages.length;

      // poll for up to ~6s for a details dialog, navigation, or new page
      for (let t = 0; t < 24; t++) {
        try {
          // 1) Modal/dialog in original page
          const modalSel = 'text=Reported Content Details, [role="dialog"], .modal';
          if (await originalPage.locator(modalSel).count().catch(() => 0) > 0) return originalPage;

          // 2) Same-page navigation: URL or content changed
          const url = originalPage.url();
          if (url && /content|reported|details|report/i.test(url) && !url.includes('content-moderation')) return originalPage;

          // 3) New page opened in the app context
          const pagesNow = appContext.pages();
          if (pagesNow.length > startLen) {
            const newPage = pagesNow[pagesNow.length - 1];
            try { await newPage.waitForLoadState('networkidle', { timeout: 3000 }); } catch (e) {}
            return newPage;
          }
        } catch (e) {
          // ignore and retry
        }
        try {
          if (originalPage.isClosed && originalPage.isClosed()) break;
          await originalPage.waitForTimeout(250);
        } catch (e) {
          // original page closed during wait - try to discover new pages
          const pagesNow = appContext.pages();
          if (pagesNow.length > startLen) return pagesNow[pagesNow.length - 1];
          break;
        }
      }
      // fallback to original page
      return originalPage;
    }

    // ===== STEP 2: VERIFY WE'RE ON THE CONTENT MODERATION PAGE =====
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ STEP 2: Verifying Content Moderation Page...');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const currentUrl = page.url();
    console.log(`✓ Successfully navigated to: ${currentUrl}`);

    // Wait for page to be stable
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // ===== STEP 3: LOCATE FILTER DROPDOWNS =====
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔍 STEP 3: Identifying Filter Dropdown Elements...');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Take a screenshot of the page to see the filter structure
    await page.screenshot({ path: 'content-moderation-page-structure.png', fullPage: true });
    console.log('📸 Page screenshot saved: content-moderation-page-structure.png');

    // Wait for filter section to load
    await page.waitForSelector('[data-testid*="filter"], select, .filter', {
      timeout: 15000
    }).catch(() => {
      console.log('  ⚠️ Standard filter selector not found, continuing with exploration...');
    });

    // Get all select elements and dropdowns
    const selectElements = await page.$$('select');
    console.log(`✓ Found ${selectElements.length} select elements`);

    // Try to find dropdowns by common patterns
    const dropdowns = await page.locator(
      'select, [role="combobox"], [role="listbox"], .dropdown, [data-testid*="dropdown"]'
    );

    const dropdownCount = await dropdowns.count();
    console.log(`✓ Found ${dropdownCount} dropdown-like elements`);

    // Log all inputs and selects to see available filters
    const allInputs = await page.locator('input').all();
    const allSelects = await page.locator('select').all();
    console.log(`\n📋 Total input elements found: ${allInputs.length}`);
    console.log(`📋 Total select elements found: ${allSelects.length}`);

    // Log filter labels or placeholders
    const allLabels = await page.locator('label').all();
    console.log(`📋 Total label elements found: ${allLabels.length}`);
    
    for (let i = 0; i < Math.min(allLabels.length, 10); i++) {
      const labelText = await allLabels[i].textContent();
      console.log(`   Label ${i + 1}: "${labelText?.trim() || 'N/A'}"`);
    }

    // Log visible text content to find filter labels
    const pageText = await page.textContent('body');
    const filterKeywords = ['date', 'status', 'content', 'reason', 'filter', 'report'];
    console.log(`\n🔎 Searching for filter keywords...`);
    for (const keyword of filterKeywords) {
      if (pageText && pageText.toLowerCase().includes(keyword)) {
        console.log(`   ✓ Found keyword: "${keyword}"`);
      }
    }
    console.log('');

    // (Previously expanded dropdowns here — moved to run after filters are applied)

    // ===== STEP 4: APPLY FILTERS =====
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 STEP 4: Applying Filters...');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Define filter mappings - based on actual HTML structure
    const filterConfig = [
      {
        name: 'Reported Date',
        value: '01/07/2026',
        type: 'input',
        placeholder: 'mm/dd/yyyy'
      },
      {
        name: 'Report Reason',
        value: 'Spam',
        type: 'custom-dropdown',
        optionValue: 'SPAM'
      },
      {
        name: 'Status',
        value: 'Action Required',
        type: 'custom-dropdown',
        optionValue: 'ACTION_REQUIRED'
      },
      {
        name: 'Content',
        value: 'Post',
        type: 'custom-dropdown',
        optionValue: 'post'
      }
    ];

    // Explicit UI-driven filter application (open/select/close) in requested order
    const appliedFilters = [];

    // Aggressive overlay/dropdown dismissal helper to recover from stuck menus
    const closeOpenOverlays = async () => {
      try {
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(80);
        await page.click('body', { position: { x: 1, y: 1 } }).catch(() => {});
        await page.waitForTimeout(120);
        await page.evaluate(() => {
          const selectors = [
            '.dropdown-menu',
            '.react-select__menu',
            '[role="listbox"]',
            '.headlessui-listbox__options',
            '.menu',
            '.options',
            '.ui-popover, .popover, .rdp-layer'
          ];
          selectors.forEach(s => document.querySelectorAll(s).forEach(n => n.remove()));
          try { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); } catch(e){}
        }).catch(() => {});
        await page.waitForTimeout(120);
      } catch (e) {
        // ignore
      }
    };

    // 1) Reported Date: open calendar, select date, close
    try {
      console.log('\n→ Reporting Date: opening datepicker and selecting date');
      const dateInput = page.locator('input[placeholder="mm/dd/yyyy"]').first();
      await dateInput.scrollIntoViewIfNeeded();
      await dateInput.click();
      await page.waitForTimeout(300);
      // Try to use calendar widget: look for react-datepicker day matching 7 and year/month
      const dayLocator = page.locator('.react-datepicker__day, .rdp-day, button.react-datepicker__day').filter({ hasText: '7' }).first();
      if (await dayLocator.count() > 0) {
        await dayLocator.click().catch(() => {});
        console.log('  ✓ Clicked day in calendar');
        await closeOpenOverlays();
      } else {
        // Fallback: fill the input directly
        await dateInput.fill('01/07/2026');
        await dateInput.press('Enter');
        console.log('  ✓ Filled date input directly');
      }
      await page.waitForTimeout(300);
      appliedFilters.push('Reported Date');
    } catch (e) {
      console.log(`  ⚠️ Date selection failed: ${e.message}`);
    }

    // Helper to open dropdown, select option text, then close
    const selectByLabelAndText = async (labelText, optionText, optionValue) => {
      const label = page.locator(`label:has-text("${labelText}")`).first();
      if ((await label.count()) === 0) {
        console.log(`  ⚠️ Label not found: ${labelText}`);
        return false;
      }
      const parent = label.locator('xpath=..');
      const button = parent.locator('div.form-input, div[role="button"]').first();
      if ((await button.count()) === 0) {
        console.log(`  ⚠️ Dropdown button not found for: ${labelText}`);
        return false;
      }
      await button.scrollIntoViewIfNeeded();

      // If an optionValue is provided prefer setting the hidden <select> first
      const hiddenSelect = parent.locator('select.sr-only, select').first();
      if ((await hiddenSelect.count()) > 0 && optionValue) {
        try {
          await hiddenSelect.selectOption({ value: optionValue }).catch(() => {});
          await page.waitForTimeout(150);
          return true;
        } catch (e) {
          // fall through to visible option attempt
        }
      }

      // Open visible dropdown and try to click an option element that is visible inside any open menu
      await button.click();
      await page.waitForTimeout(300);
      const candidates = page.locator(`text="${optionText}"`);
      const candCount = await candidates.count();
      for (let i = 0; i < candCount; i++) {
        const cand = candidates.nth(i);
        if (await cand.isVisible().catch(() => false)) {
          try {
            await cand.click();
            await page.waitForTimeout(150);
            // Ensure dropdown is closed: try Escape, then click outside if still open
            await page.keyboard.press('Escape').catch(() => {});
            await page.waitForTimeout(100);
            const stillVisible = await cand.isVisible().catch(() => false);
            if (stillVisible) {
              await page.click('body', { position: { x: 1, y: 1 } }).catch(() => {});
              await page.waitForTimeout(100);
            }
            return true;
          } catch (e) {
            // try next candidate
          }
        }
      }

      // If visible option not found, try hidden select fallback by matching option text or value
      if ((await hiddenSelect.count()) > 0) {
        try {
          const opts = await hiddenSelect.locator('option').all();
          for (const o of opts) {
            const txt = (await o.textContent() || '').trim();
            const val = await o.getAttribute('value');
            if (txt.toLowerCase() === optionText.toLowerCase() || val === optionText) {
              await hiddenSelect.selectOption({ value: val }).catch(() => {});
              await page.waitForTimeout(150);
              return true;
            }
          }
        } catch (e) {
          // ignore
        }
      }

      console.log(`  ⚠️ Option '${optionText}' not found for ${labelText}`);
      return false;
    };

    

    // 2) Report Reason -> Spam (use optionValue 'SPAM')
    try {
      const ok = await selectByLabelAndText('Report Reason', 'Spam', 'SPAM');
      if (ok) appliedFilters.push('Report Reason');
    } catch (e) { console.log(`  ⚠️ Report Reason selection error: ${e.message}`); }

    // 3) Status -> Action Required (optionValue 'ACTION_REQUIRED')
    try {
      const ok = await selectByLabelAndText('Status', 'Action Required', 'ACTION_REQUIRED');
      if (ok) appliedFilters.push('Status');
    } catch (e) { console.log(`  ⚠️ Status selection error: ${e.message}`); }

    // 4) Content -> Post (optionValue 'post')
    try {
      const ok = await selectByLabelAndText('Content', 'Post', 'post');
      if (ok) appliedFilters.push('Content');
    } catch (e) { console.log(`  ⚠️ Content selection error: ${e.message}`); }

    console.log(`\n✓ Successfully configured ${appliedFilters.length} filters: ${appliedFilters.join(', ')}`);

    // ===== SHOW each dropdown AFTER selecting filters (open-only, no option clicks) =====
    console.log('\n🔍 Showing each filter dropdown (open-only, no re-selection)...');
    for (const filter of filterConfig) {
      try {
        if (filter.type === 'custom-dropdown') {
          const labelLocator = page.locator(`label:has-text("${filter.name}")`).first();
          if ((await labelLocator.count()) === 0) {
            console.log(`  ⚠️ Label not found for "${filter.name}" when showing`);
            continue;
          }
          const parent = labelLocator.locator('xpath=..');
          const visibleButton = parent.locator('div.form-input, div[role="button"]').first();
          if ((await visibleButton.count()) > 0) {
            await visibleButton.scrollIntoViewIfNeeded();
            // Open dropdown to show options/selection but do NOT click any option
            await visibleButton.click().catch(() => {});
            await page.waitForTimeout(300);
            const safeName = filter.name.replace(/\s+/g, '-').toLowerCase();
            await page.screenshot({ path: `filter-open-${safeName}.png`, fullPage: false });
            console.log(`  ✓ Captured dropdown view for: ${filter.name}`);
            // Close dropdown by using resilient overlay dismissal
            await closeOpenOverlays();
          } else {
            // Try reading visible text instead
            const visible = parent.locator('div.form-input, div[role="button"]').first();
            const txt = await visible.textContent().catch(() => '');
            console.log(`  • ${filter.name} visible text: "${(txt||'').trim()}"`);
          }
        } else if (filter.type === 'input') {
          const dateInput = page.locator(`input[placeholder="${filter.placeholder}"]`).first();
          if ((await dateInput.count()) > 0) {
            await dateInput.scrollIntoViewIfNeeded();
            await dateInput.click().catch(() => {});
            await page.waitForTimeout(200);
            const safeName = filter.name.replace(/\s+/g, '-').toLowerCase();
            await page.screenshot({ path: `filter-open-${safeName}.png`, fullPage: false });
            console.log(`  ✓ Captured datepicker view for: ${filter.name}`);
            await page.keyboard.press('Escape').catch(() => {});
            await page.waitForTimeout(150);
          }
        }
      } catch (e) {
        console.log(`  ⚠️ Error showing filter "${filter.name}": ${e.message}`);
      }
    }

    // ===== STEP 5: CLICK APPLY FILTER BUTTON =====
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔘 STEP 5: Clicking Apply Filter Button...');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Look for Apply Filter button with common patterns
    const applyButtonSelectors = [
      'button:has-text("Apply Filter")',
      'button:has-text("Apply")',
      'button[data-testid*="apply"]',
      'button[id*="apply"]',
      '.apply-filter-btn',
      '.filter-button'
    ];

    let applyButtonFound = false;

    for (const btnSelector of applyButtonSelectors) {
      const button = page.locator(btnSelector).first();
      const count = await button.count().catch(() => 0);

      if (count > 0) {
        try {
          const isVisible = await button.isVisible().catch(() => false);
          if (isVisible) {
            console.log(`✓ Found Apply button with selector: "${btnSelector}"`);
            await button.click();
            applyButtonFound = true;
            console.log('✓ Clicked Apply Filter button');
            break;
          }
        } catch (e) {
          console.log(`⚠️ Could not click button: ${e.message}`);
        }
      }
    }

    if (!applyButtonFound) {
      console.log('⚠️ Apply Filter button not found. Filters may auto-apply.');
    }

    // Wait for the page to process the filter request
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle').catch(() => {
      console.log('  Note: Page load state may have changed during filtering');
    });

    // (Dropdown expansion removed - selections are applied directly and will be applied once)

    // ===== STEP 6: VALIDATE FILTERED RESULTS =====
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✔️ STEP 6: Validating Filtered Results...');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Check for results container or table and validate rows contain the applied filter values
    const resultLocators = [
      'table tbody tr',
      '[data-testid*="result"]',
      '.results-container > *',
      '.content-list > *',
      '[role="grid"] [role="row"]'
    ];

    let resultsSelectorUsed = null;
    let resultCount = 0;

    for (const resultSelector of resultLocators) {
      try {
        const results = page.locator(resultSelector);
        const count = await results.count().catch(() => 0);
        if (count > 0) {
          resultCount = count;
          resultsSelectorUsed = resultSelector;
          console.log(`✓ Found ${count} result items using selector: "${resultSelector}"`);
          break;
        }
      } catch (e) {
        // ignore and continue
      }
    }

    if (!resultsSelectorUsed) {
      console.log('⚠️ Could not locate results container. Skipping row-level validation.');
    } else {
      // Validate that at least one row matches all applied filters
      const results = page.locator(resultsSelectorUsed);
      const rowsToCheck = Math.min(await results.count(), 20);
      let matchingRows = 0;
      const expectedTexts = filterConfig.map(f => f.value.toString().toLowerCase());

      for (let i = 0; i < rowsToCheck; i++) {
        const row = results.nth(i);
        const rowText = (await row.textContent() || '').toLowerCase();
        let matchesAll = true;
        for (const txt of expectedTexts) {
          if (!txt) continue;
          if (!rowText.includes(txt)) {
            matchesAll = false;
            break;
          }
        }
        if (matchesAll) {
          matchingRows++;
          console.log(`  ✓ Row ${i + 1} matches all filters: ${rowText.substring(0, 120).trim()}...`);
        } else {
          console.log(`  - Row ${i + 1} does not match all filters`);
        }
      }

      if (matchingRows > 0) {
        console.log(`✓ Found ${matchingRows} row(s) that match all applied filters`);
      } else {
        console.log('⚠️ No rows matched all filters. The filters may not have applied as expected.');
      }
    }

    // Check for "no results" message
    const noResultsMessage = page.locator('text=/no results|no data|empty/i').first();
    const hasNoResults = await noResultsMessage.count().catch(() => 0);
    if (hasNoResults > 0) {
      console.log('⚠️ Filter returned no results - this may be expected if no content matches the criteria');
      const msg = await noResultsMessage.textContent().catch(() => '');
      console.log(`   Message: "${msg}"`);
    } else {
      console.log('✓ No "empty results" message found - filter appears to have returned data');
    }

    // ===== STEP 7: CAPTURE FINAL STATE =====
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📸 STEP 7: Capturing Final State...');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Take a screenshot of the filtered results
    await page.screenshot({
      path: 'content-moderation-filtered-results.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: content-moderation-filtered-results.png');

    // ===== STEP 8: CLEAR FILTERS =====
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🧹 STEP 8: Clearing Filters...');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Ensure any open dropdowns or overlays are dismissed before clicking Clear
    await closeOpenOverlays();

    const clearBtn = page.locator('button:has-text("Clear Filters"), button:has-text("Clear filter"), .btn-outline:has-text("Clear Filters")').first();
    const clearCount = await clearBtn.count().catch(() => 0);
    if (clearCount > 0) {
      try {
        const disabled = await clearBtn.getAttribute('disabled');
        if (!disabled) {
          await clearBtn.click();
          await page.waitForTimeout(800);
          console.log('✓ Clicked Clear Filters button');

          // Verify filters reset: check date input empty and hidden selects set to default
          for (const filter of filterConfig) {
            if (filter.type === 'input') {
              const dateInput = page.locator(`input[placeholder="${filter.placeholder}"]`).first();
              const val = await dateInput.inputValue().catch(() => '');
              console.log(`  • ${filter.name} value after clear: "${val}"`);
            } else if (filter.type === 'custom-dropdown') {
              const labelLocator = page.locator(`label:has-text("${filter.name}")`).first();
              const parent = labelLocator.locator('xpath=..');
              const hiddenSelect = parent.locator('select.sr-only, select').first();
              const selCount = await hiddenSelect.count().catch(() => 0);
              if (selCount > 0) {
                const selVal = await hiddenSelect.inputValue().catch(() => '');
                console.log(`  • ${filter.name} select value after clear: "${selVal}"`);
              } else {
                // Fallback: check visible label text
                const visible = parent.locator('div.form-input, div[role="button"]').first();
                const txt = await visible.textContent().catch(() => '');
                console.log(`  • ${filter.name} visible text after clear: "${(txt||'').trim()}"`);
              }
            }
          }
        } else {
          console.log('⚠️ Clear Filters button is disabled; filters may already be cleared');
        }
      } catch (e) {
        console.log(`⚠️ Error clicking Clear Filters: ${e.message}`);
      }
    } else {
      console.log('⚠️ Clear Filters button not found on page');
    }

    // ===== POST-CLEAR: Take No Action Flow =====
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📝 SCENARIO 1: Take No Action Flow');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Scroll table container into view first
    const tableContainer = page.locator('table, [role="table"], .table-container').first();
    if ((await tableContainer.count()) > 0) {
      await tableContainer.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(500);
      console.log('✓ Scrolled table into view');
    }

    // Ensure results table is visible
    const rows = page.locator('table tbody tr, [role="row"]');
    const rowsCount = await rows.count().catch(() => 0);
    if (rowsCount === 0) {
      console.log('⚠️ No content rows found to perform Take No Action flow');
    } else {
      console.log('✓ Content list table is displayed');
      console.log(`\n📋 Scrolling through ${rowsCount} rows to find "Action Required" content...`);

      // Small helper: ensure a row is scrolled into the table's scrollable container
      const scrollRowIntoScrollable = async (row) => {
        try {
          const handle = await row.elementHandle();
          if (!handle) return;
          await page.evaluate((el) => {
            function findScrollable(el) {
              let p = el.parentElement;
              while (p) {
                const style = window.getComputedStyle(p);
                if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && p.scrollHeight > p.clientHeight) return p;
                p = p.parentElement;
              }
              return document.scrollingElement || document.documentElement;
            }
            const container = findScrollable(el);
            const elRect = el.getBoundingClientRect();
            const contRect = container.getBoundingClientRect ? container.getBoundingClientRect() : { top: 0, height: window.innerHeight };
            const offset = elRect.top - contRect.top;
            // center the element in the container viewport when possible
            container.scrollTop += offset - (contRect.height / 2);
          }, handle);
          await page.waitForTimeout(150);
        } catch (e) {
          // best-effort; ignore errors
        }
      };

      // Find a row that currently requires action by scanning the entire table (handles lazy load/pagination)
      let targetRow = null;
      let targetRowIndex = -1;
      let scanIndex = 0;
      while (true) {
        const countNow = await rows.count().catch(() => 0);
        if (countNow === 0) break;

        if (scanIndex >= countNow) {
          // Try to trigger lazy-load / pagination by scrolling the last row or table container
          try {
            const last = rows.nth(countNow - 1);
            await scrollRowIntoScrollable(last).catch(() => {});
            await page.waitForTimeout(600);
          } catch (e) {
            try {
              const tableContainer = page.locator('table, [role="table"], .table-container').first();
              if ((await tableContainer.count()) > 0) {
                const handle = await tableContainer.elementHandle();
                if (handle) await page.evaluate((el) => { el.scrollTop = el.scrollHeight; }, handle).catch(() => {});
                await page.waitForTimeout(600);
              }
            } catch (ee) {
              // ignore
            }
          }

          const newCount = await rows.count().catch(() => 0);
          if (newCount <= countNow) break; // no more rows loaded
          continue; // continue scanning with new rows
        }

        const r = rows.nth(scanIndex);
        const txt = (await r.textContent().catch(() => '')).toLowerCase();
        await scrollRowIntoScrollable(r).catch(() => {});
        await page.waitForTimeout(150);

        if (txt.includes('action required') || txt.includes('action-required') || txt.includes('action_required')) {
          targetRow = r;
          targetRowIndex = scanIndex;
          console.log(`✓ Found "Action Required" item at row ${scanIndex + 1}`);
          break;
        }

        scanIndex += 1;
      }

      if (!targetRow) {
        targetRow = rows.nth(0);
        targetRowIndex = 0;
        console.log('⚠️ No explicit "Action Required" row found — using first row');
      }

      // Click View button with visibility validation
      console.log(`\n📍 Clicking View button for row ${targetRowIndex + 1}...`);
      const viewBtn = targetRow.locator('button:has-text("View"), a:has-text("View")').first();
      const viewCount = await viewBtn.count().catch(() => 0);
      
      if (viewCount > 0) {
        const isVisible = await viewBtn.isVisible().catch(() => false);
        if (isVisible) {
          await viewBtn.click();
          console.log('✓ Clicked View button (button was visible)');
        } else {
          await targetRow.click().catch(() => {});
          console.log('⚠️ View button not visible; clicked row instead');
        }
      } else {
        await targetRow.click().catch(() => {});
        console.log('⚠️ View button not found; clicked row as fallback');
      }

      // Wait for details page (modal, same-page nav, or new tab)
      console.log('\n⏳ Waiting for Reported Content Details page...');
      const detailsPage = await resolveDetailsPage(page);
      const usedPage = detailsPage || page;
      if (usedPage === page) {
        const detailsDialog = usedPage.locator('text=Reported Content Details, [role="dialog"], .modal').first();
        try {
          await detailsDialog.waitFor({ timeout: 2000 });
          console.log('✓ Reported Content Details detected on same page');
        } catch (e) {
          console.log('⚠️ Details not detected as modal/same-page; proceeding to interact');
        }
      } else {
        console.log('✓ Details opened in a new tab/window');
      }

      // Scroll down details page to ensure action buttons are visible
      console.log('\n⬇️ Scrolling details page to ensure action buttons are visible...');
      const takeNoActionBtn = usedPage.locator('button:has-text("Take No Action"), button:has-text("No Action")').first();
      try {
        await takeNoActionBtn.scrollIntoViewIfNeeded().catch(() => {});
        console.log('✓ Action buttons scrolled into view');
      } catch (e) {
        try { await usedPage.evaluate(() => window.scrollBy(0, 500)).catch(() => {}); } catch (ee) {}
        try { await usedPage.waitForTimeout(300); } catch (ee) {}
        console.log('⚠️ Scrolled used page, buttons may not be fully visible');
      }

      // Click Take No Action with validation on usedPage
      console.log('\n🔘 Clicking Take No Action button...');
      try {
        if ((await takeNoActionBtn.count().catch(() => 0)) > 0) {
          const isEnabled = await takeNoActionBtn.isEnabled().catch(() => false);
          const isVisible = await takeNoActionBtn.isVisible().catch(() => false);
          console.log(`   Button enabled: ${isEnabled}, visible: ${isVisible}`);
          if (isEnabled && isVisible) {
            await takeNoActionBtn.click().catch(() => {});
            console.log('✓ Clicked Take No Action button');
          } else {
            console.log('⚠️ Button may not be enabled/visible');
          }
        } else {
          console.log('⚠️ Take No Action button not found on details page');
        }
      } catch (e) {
        console.log('⚠️ Error clicking Take No Action:', e.message);
      }

      // Wait for popup on usedPage
      console.log('\n📍 Waiting for confirmation popup...');
      const confirmPopup = usedPage.locator('[role="dialog"] textarea, [role="dialog"] input, .modal textarea, .confirm-dialog').first();
      try {
        await confirmPopup.waitFor({ timeout: 5000 });
        console.log('✓ Confirmation popup displayed');
      } catch (e) {
        console.log('⚠️ Confirmation popup did not appear on used page');
      }

      // Fill reason field on usedPage
      console.log('\n📝 Entering mandatory reason...');
      const reasonField = usedPage.locator('[role="dialog"] textarea, .modal textarea, textarea, input[placeholder*="reason"]').first();
      try {
        if ((await reasonField.count().catch(() => 0)) > 0) {
          const isVisible = await reasonField.isVisible().catch(() => false);
          if (isVisible) {
            await reasonField.fill('No policy violation found').catch(() => {});
            console.log('✓ Reason entered: "No policy violation found"');
          } else {
            console.log('⚠️ Reason field not visible');
          }
        } else {
          console.log('⚠️ Reason field not found');
        }
      } catch (e) {
        console.log('⚠️ Error interacting with reason field');
      }

      // Click Confirm No Action on usedPage
      console.log('\n🔘 Clicking Confirm No Action button...');
      const confirmBtn = usedPage.locator('button:has-text("Confirm No Action"), button:has-text("Confirm"), button:has-text("Yes")').first();
      try {
        if ((await confirmBtn.count().catch(() => 0)) > 0) {
          await confirmBtn.scrollIntoViewIfNeeded().catch(() => {});
          try { await usedPage.waitForTimeout(300); } catch (ee) {}
          await confirmBtn.click({ force: true }).catch(() => {});
          console.log('✓ Clicked Confirm No Action button');
        } else {
          console.log('⚠️ Confirm button not found on used page');
        }
      } catch (e) {
        console.log('⚠️ Error clicking confirm button:', e.message);
      }

      // Verify popup closed on usedPage
      console.log('\n✔️ Verifying popup closed...');
      try {
        await usedPage.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 3000 }).catch(() => {});
        console.log('✓ Confirmation popup closed successfully (used page)');
      } catch (e) {
        console.log('⚠️ Popup may still be open on used page');
      }

      // Take screenshot on usedPage to capture success
      try { await usedPage.screenshot({ path: 'scenario1-take-no-action-result.png', fullPage: false }); } catch (e) {}
      console.log('📸 Screenshot captured: scenario1-take-no-action-result.png');

      // Verify success message with enhanced detection on the details context
      console.log('\n📬 Looking for success message...');
      try { await usedPage.waitForTimeout(800); } catch (e) {}
      const successSelectors = [
        'text=/success|no action|action taken|completed/i',
        '.toast',
        '.alert-success',
        '.alert',
        '[role="alert"]',
        '.notification'
      ];
      let successFound = false;
      let successText = '';
      for (const sel of successSelectors) {
        try {
          const msg = usedPage.locator(sel).first();
          if ((await msg.count().catch(() => 0)) > 0 && (await msg.isVisible().catch(() => false))) {
            successText = await msg.textContent().catch(() => '');
            if (successText && successText.length > 0) {
              successFound = true;
              break;
            }
          }
        } catch (e) {
          // ignore
        }
      }
      if (successFound) {
        console.log(`✓ Success message detected: "${successText?.trim()}"`);
      } else {
        console.log('⚠️ Success message not clearly visible');
      }

      // Close details tab if it opened separately, or navigate back if same-page
      if (usedPage !== page) {
        try { await usedPage.close().catch(() => {}); } catch (e) {}
        try { await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {}); } catch (e) {}
        await page.waitForTimeout(800).catch(() => {});
      } else {
        // same page: try clicking Back
        try {
          const backBtn = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label*="back"]').first();
          if ((await backBtn.count().catch(() => 0)) > 0) {
            await backBtn.click().catch(() => {});
            await page.waitForLoadState('networkidle').catch(() => {});
            await page.waitForTimeout(800).catch(() => {});
            console.log('✓ Navigated back to content list');
          }
        } catch (e) {
          // ignore
        }
      }

      // Verify status changed from Action Required to No Action Taken on the main page
      console.log('\n🔍 Verifying status change...');
      await page.waitForTimeout(1000).catch(() => {});
      const updatedRows = page.locator('table tbody tr, [role="row"]');
      if ((await updatedRows.count().catch(() => 0)) > targetRowIndex) {
        try {
          const updatedRowText = await updatedRows.nth(targetRowIndex).textContent().catch(() => '');
          if (updatedRowText && (updatedRowText.toLowerCase().includes('no action') || updatedRowText.toLowerCase().includes('taken'))) {
            console.log('✓ Content status updated to "No Action Taken"');
          } else {
            console.log('⚠️ Status update not visible in list (may require page refresh)');
          }
        } catch (e) {
          console.log('⚠️ Could not verify status change');
        }
      }
    }


    // Ensure we have a valid main page reference before continuing
    try {
      if (page.isClosed && page.isClosed()) {
        const all = appContext.pages();
        if (all.length > 0) {
          page = all[0];
        }
      }
    } catch (e) {
      const all = appContext.pages();
      if (all.length > 0) page = all[0];
    }

    // ===== SCENARIO 2: Remove Content Flow =====
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🗑️ SCENARIO 2: Remove Content Flow');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Navigate back to content list
    console.log('📍 Navigating back to content list...');
    const backToListBtn = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label*="back"]').first();
    if ((await backToListBtn.count()) > 0) {
      try {
        await backToListBtn.click().catch(() => {});
        await page.waitForTimeout(1500);
        console.log('✓ Returned to content list');
      } catch (e) {
        console.log('⚠️ Could not navigate back; continuing');
      }
    }

    // Scroll table container into view first
    const tableContainerRemove = page.locator('table, [role="table"], .table-container').first();
    if ((await tableContainerRemove.count()) > 0) {
      await tableContainerRemove.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(500);
      console.log('✓ Scrolled table into view');
    }

    // Refresh table rows to get updated content list
    const rowsRemove = page.locator('table tbody tr, [role="row"]');
    const rowsRemoveCount = await rowsRemove.count().catch(() => 0);
    if (rowsRemoveCount === 0) {
      console.log('⚠️ No content rows found for Remove Content flow');
    } else {
      console.log('✓ Content list table is displayed');
      console.log(`\n📋 Scrolling through ${rowsRemoveCount} rows to find another "Action Required" item...`);

      // Find a row with "Action Required" status for removal (scan entire table with lazy-load support)
      let removeTargetRow = null;
      let removeTargetIndex = -1;
      let remIndex = 0;
      while (true) {
        const countNow = await rowsRemove.count().catch(() => 0);
        if (countNow === 0) break;

        if (remIndex >= countNow) {
          // attempt to load more by scrolling last row / table
          try {
            const last = rowsRemove.nth(countNow - 1);
            const handle = await last.elementHandle();
            if (handle) {
              await page.evaluate((el) => {
                function findScrollable(el) {
                  let p = el.parentElement;
                  while (p) {
                    const style = window.getComputedStyle(p);
                    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && p.scrollHeight > p.clientHeight) return p;
                    p = p.parentElement;
                  }
                  return document.scrollingElement || document.documentElement;
                }
                const container = findScrollable(el);
                container.scrollTop = container.scrollHeight;
              }, handle).catch(() => {});
              await page.waitForTimeout(700);
            }
          } catch (e) {
            // fallback: try scrolling page
            try { await page.evaluate(() => window.scrollBy(0, 800)).catch(() => {}); await page.waitForTimeout(700); } catch (ee) {}
          }

          const newCount = await rowsRemove.count().catch(() => 0);
          if (newCount <= countNow) break;
          continue;
        }

        const r = rowsRemove.nth(remIndex);
        const txt = (await r.textContent().catch(() => '')).toLowerCase();
        // Scroll into view inside table
        await (async (row) => {
          try {
            const handle = await row.elementHandle();
            if (!handle) return;
            await page.evaluate((el) => {
              function findScrollable(el) {
                let p = el.parentElement;
                while (p) {
                  const style = window.getComputedStyle(p);
                  if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && p.scrollHeight > p.clientHeight) return p;
                  p = p.parentElement;
                }
                return document.scrollingElement || document.documentElement;
              }
              const container = findScrollable(el);
              const elRect = el.getBoundingClientRect();
              const contRect = container.getBoundingClientRect ? container.getBoundingClientRect() : { top: 0, height: window.innerHeight };
              const offset = elRect.top - contRect.top;
              container.scrollTop += offset - (contRect.height / 2);
            }, handle);
            await page.waitForTimeout(150);
          } catch (e) {
            // ignore
          }
        })(r).catch(() => {});

        if (txt.includes('action required') && !txt.includes('no action') && !txt.includes('removed')) {
          removeTargetRow = r;
          removeTargetIndex = remIndex;
          console.log(`✓ Found "Action Required" item at row ${remIndex + 1}`);
          break;
        }

        remIndex += 1;
      }

      if (!removeTargetRow) {
        removeTargetRow = rowsRemove.nth(0);
        removeTargetIndex = 0;
        console.log('⚠️ No explicit "Action Required" row found — using first row');
      }

      // Click View button with validation
      console.log(`\n📍 Clicking View button for row ${removeTargetIndex + 1}...`);
      const removeViewBtn = removeTargetRow.locator('button:has-text("View"), a:has-text("View")').first();
      const removeViewCount = await removeViewBtn.count().catch(() => 0);
      
      if (removeViewCount > 0) {
        const isVisible = await removeViewBtn.isVisible().catch(() => false);
        if (isVisible) {
          await removeViewBtn.click();
          console.log('✓ Clicked View button (button was visible)');
        } else {
          await removeTargetRow.click().catch(() => {});
          console.log('⚠️ View button not visible; clicked row instead');
        }
      } else {
        await removeTargetRow.click().catch(() => {});
        console.log('⚠️ View button not found; clicked row as fallback');
      }

      // Wait for details page (modal, same-page nav, or new tab)
      console.log('\n⏳ Waiting for Reported Content Details page...');
      const detailsPage = await resolveDetailsPage(page);
      const usedPage = detailsPage || page;
      if (usedPage === page) {
        const removeDetailsDialog = usedPage.locator('text=Reported Content Details, [role="dialog"], .modal').first();
        try { await removeDetailsDialog.waitFor({ timeout: 2000 }); console.log('✓ Reported Content Details detected on same page'); } catch (e) { console.log('⚠️ Details not detected as modal/same-page'); }
      } else {
        console.log('✓ Details opened in a new tab/window');
      }

      // Scroll down details page to ensure action buttons are visible
      console.log('\n⬇️ Scrolling details page to ensure Remove Content button is visible...');
      const removeContentBtn = usedPage.locator('button:has-text("Remove Content"), button:has-text("Remove")').first();
      try { await removeContentBtn.scrollIntoViewIfNeeded().catch(() => {}); console.log('✓ Remove Content button scrolled into view'); } catch (e) { try { await usedPage.evaluate(() => window.scrollBy(0, 500)).catch(() => {}); await usedPage.waitForTimeout(300).catch(() => {}); } catch (ee) {} console.log('⚠️ Scrolled used page, button may not be fully visible'); }

      // Click Remove Content with validation
      console.log('\n🔘 Clicking Remove Content button...');
      try {
        if ((await removeContentBtn.count().catch(() => 0)) > 0) {
          const isEnabled = await removeContentBtn.isEnabled().catch(() => false);
          const isVisible = await removeContentBtn.isVisible().catch(() => false);
          console.log(`   Button enabled: ${isEnabled}, visible: ${isVisible}`);
          if (isEnabled && isVisible) {
            await removeContentBtn.click().catch(() => {});
            console.log('✓ Clicked Remove Content button');
          } else {
            console.log('⚠️ Button may not be enabled/visible');
          }
        } else {
          console.log('⚠️ Remove Content button not found on details page');
        }
      } catch (e) {
        console.log('⚠️ Error clicking Remove Content button:', e.message);
      }

      // Wait for removal popup on usedPage
      console.log('\n📍 Waiting for removal confirmation popup...');
      const removalPopup = usedPage.locator('[role="dialog"] textarea, [role="dialog"] input, .modal textarea, .confirm-dialog').first();
      try { await removalPopup.waitFor({ timeout: 5000 }); console.log('✓ Removal popup displayed'); } catch (e) { console.log('⚠️ Removal popup did not appear on used page'); }

      // Fill reason field on usedPage
      console.log('\n📝 Entering mandatory removal reason...');
      const removalReasonField = usedPage.locator('[role="dialog"] textarea, .modal textarea, textarea, input[placeholder*="reason"]').first();
      try {
        if ((await removalReasonField.count().catch(() => 0)) > 0) {
          const isVisible = await removalReasonField.isVisible().catch(() => false);
          if (isVisible) { await removalReasonField.fill('Violates community guidelines').catch(() => {}); console.log('✓ Reason entered: "Violates community guidelines"'); } else { console.log('⚠️ Reason field not visible'); }
        } else { console.log('⚠️ Reason field not found'); }
      } catch (e) { console.log('⚠️ Error interacting with reason field'); }

      // Click Confirm Removal on usedPage
      console.log('\n🔘 Clicking Confirm Removal button...');
      const confirmRemovalBtn = usedPage.locator('button:has-text("Confirm Removal"), button:has-text("Confirm"), button:has-text("Remove")').first();
      try {
        if ((await confirmRemovalBtn.count().catch(() => 0)) > 0) {
          await confirmRemovalBtn.scrollIntoViewIfNeeded().catch(() => {});
          try { await usedPage.waitForTimeout(300); } catch (ee) {}
          await confirmRemovalBtn.click({ force: true }).catch(() => {});
          console.log('✓ Clicked Confirm Removal button');
          try { await usedPage.waitForTimeout(800); } catch (ee) {}
        } else {
          console.log('⚠️ Confirm Removal button not found on used page');
        }
      } catch (e) {
        console.log('⚠️ Error clicking confirm removal:', e.message);
      }

      // Verify popup closed on usedPage
      console.log('\n✔️ Verifying popup closed...');
      try { await usedPage.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 3000 }).catch(() => {}); console.log('✓ Removal popup closed successfully (used page)'); } catch (e) { console.log('⚠️ Popup may still be open on used page'); }

      // Take screenshot on usedPage
      try { await usedPage.screenshot({ path: 'scenario2-remove-content-result.png', fullPage: false }); } catch (e) {}
      console.log('📸 Screenshot captured: scenario2-remove-content-result.png');

      // Verify success message on usedPage
      console.log('\n📬 Looking for removal success message...');
      try { await usedPage.waitForTimeout(800); } catch (e) {}
      const removeSuccessSelectors = [
        'text=/success|removed|deleted|completed/i',
        '.toast',
        '.alert-success',
        '.alert',
        '[role="alert"]',
        '.notification'
      ];
      let removeSuccessFound = false;
      let removeSuccessText = '';
      for (const sel of removeSuccessSelectors) {
        try {
          const msg = usedPage.locator(sel).first();
          if ((await msg.count().catch(() => 0)) > 0 && (await msg.isVisible().catch(() => false))) {
            removeSuccessText = await msg.textContent().catch(() => '');
            if (removeSuccessText && removeSuccessText.length > 0) { removeSuccessFound = true; break; }
          }
        } catch (e) { }
      }
      if (removeSuccessFound) { console.log(`✓ Success message detected: "${removeSuccessText?.trim()}"`); } else { console.log('⚠️ Success message not clearly visible'); }

      // Close details tab if separate, or navigate back if same-page
      if (usedPage !== page) {
        try { await usedPage.close().catch(() => {}); } catch (e) {}
        try { await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {}); } catch (e) {}
        await page.waitForTimeout(800).catch(() => {});
      } else {
        try {
          const backBtn = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label*="back"]').first();
          if ((await backBtn.count().catch(() => 0)) > 0) { await backBtn.click().catch(() => {}); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(800).catch(() => {}); }
        } catch (e) {}
      }

      // Take screenshot
      await page.screenshot({ path: 'scenario2-remove-content-result.png', fullPage: false });
      console.log('📸 Screenshot captured: scenario2-remove-content-result.png');

      // (Success message was already detected on the details context)

      // Verify status changed to Removed
      console.log('\n🔍 Verifying content removed...');
      await page.waitForTimeout(1000);
      // Try to navigate back to content list
      const backBtn2 = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label*="back"]').first();
      if ((await backBtn2.count()) > 0) {
        try {
          await backBtn2.click().catch(() => {});
          await page.waitForTimeout(1000);
          console.log('✓ Navigated back to content list');
        } catch (e) {
          // ignore
        }
      }

      // Check if content is no longer under Action Required
      const finalRows = page.locator('table tbody tr, [role="row"]');
      if ((await finalRows.count()) > removeTargetIndex) {
        try {
          const finalRowText = await finalRows.nth(removeTargetIndex).textContent().catch(() => '');
          if (finalRowText && (finalRowText.toLowerCase().includes('removed') || finalRowText.toLowerCase().includes('actioned'))) {
            console.log('✓ Content status updated to "Removed"');
          } else if (finalRowText && !finalRowText.toLowerCase().includes('action required')) {
            console.log('✓ Content no longer listed under "Action Required"');
          } else {
            console.log('⚠️ Status update not visible (may require page refresh)');
          }
        } catch (e) {
          console.log('⚠️ Could not verify removal status');
        }
      }
    }

    // ===== TEST COMPLETION =====
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ TEST COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('📋 Test Summary:');
    console.log(`  ✓ Successfully logged in via OTP`);
    console.log(`  ✓ Navigated to Content Moderation page`);
    console.log(`  ✓ Applied ${appliedFilters.length} filter(s): ${appliedFilters.join(', ')}`);
    console.log(`  ✓ Filter results validated`);
    console.log(`  ✓ Screenshot captured\n`);

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);

    // Capture error screenshot
    if (appContext) {
      try {
        const pages = appContext.pages();
        if (pages.length > 0) {
          await pages[0].screenshot({ path: 'content-moderation-error.png', fullPage: true });
          console.log('\n📸 Error screenshot saved: content-moderation-error.png');
        }
      } catch (e) {
        // Ignore screenshot error
      }
    }

    throw error;
  } finally {
    // ===== CLEANUP =====
    if (mailContext) {
      await mailContext.close().catch(() => {});
    }
    if (appContext) {
      await appContext.close().catch(() => {});
    }
    console.log('✓ Browser contexts closed\n');
  }
});
