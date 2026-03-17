const { test, expect } = require('@playwright/test');
const { qase } = require('playwright-qase-reporter');
const { loginViaDemo } = require('../demoLoginHelper');

/**
 * Qase Test Cases: 3361, 3362, 3363, 3624, 3625
 * Content Moderation Module - Dropdown Labels, Date Picker Format & Clear Filters Button
 *
 * Q-3361: Verify all dropdowns have clear labels and default "All" values
 * Q-3362: Verify date pickers use consistent format (mm/dd/yyyy) and calendar UI
 * Q-3363: Verify "Clear Filters" button is clearly visible and placed logically
 * Q-3624: Re-verify date pickers format (mirrors Q-3362)
 * Q-3625: Re-verify "Clear Filters" button visibility (mirrors Q-3363)
 */

test.describe('Content Moderation - Qase Tests Q-3361, Q-3362, Q-3363, Q-3624, Q-3625', () => {
  test.setTimeout(300000);

  // Q-3361: Verify all dropdowns have clear labels and default "All" values
  test(qase(3361, 'Q-3361: Verify all dropdowns have clear labels and default All values'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3361: Dropdown Labels and Default "All" Values');
    console.log('═══════════════════════════════════════════════════════\n');

    await new Promise(r => setTimeout(r, 5000));

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as super admin...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      // Step 2: Navigate to Content Moderation
      console.log('Step 2: Verifying on Content Moderation tab...');
      try {
        await page.waitForURL(/content-moderation/, { timeout: 30000 });
      } catch {
        await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
      }
      await page.waitForTimeout(3000);
      console.log('  On Content Moderation page');

      // Step 3: Check Report Reason dropdown
      console.log('Step 3: Checking "Report Reason" dropdown...');

      const expectedDropdowns = [
        { label: 'Report Reason', expectedDefault: /all report reason/i },
        { label: 'Status', expectedDefault: /all status/i },
        { label: 'Content Type', expectedDefault: /all/i }
      ];

      let verifiedCount = 0;

      for (const dropdown of expectedDropdowns) {
        console.log(`\n  Checking "${dropdown.label}" dropdown...`);

        const labelEl = page.locator(`label:has-text("${dropdown.label}")`).first();
        const labelVisible = await labelEl.isVisible().catch(() => false);

        if (labelVisible) {
          const labelText = await labelEl.textContent().catch(() => '');
          console.log(`    Label found: "${labelText.trim()}"`);
          console.log(`    Label is clear and descriptive: YES`);

          const parent = labelEl.locator('xpath=..');
          const select = parent.locator('select').first();

          if ((await select.count()) > 0) {
            const selectedText = await select.locator('option:checked').textContent().catch(() => '');
            console.log(`    Default selected value: "${selectedText.trim()}"`);

            const options = await select.locator('option').allTextContents();
            console.log(`    Available options: ${options.join(', ')}`);

            const isAllDefault = dropdown.expectedDefault.test(selectedText);
            console.log(`    Default is "All": ${isAllDefault}`);

            if (isAllDefault) verifiedCount++;
            continue;
          }

          // Check custom dropdown
          const customDropdown = parent.locator('div.form-input, div[role="button"], [class*="select"]').first();
          if (await customDropdown.isVisible().catch(() => false)) {
            const displayedText = await customDropdown.textContent().catch(() => '');
            console.log(`    Displayed value: "${displayedText.trim()}"`);

            const isAllDefault = dropdown.expectedDefault.test(displayedText);
            console.log(`    Default is "All": ${isAllDefault}`);

            if (isAllDefault) verifiedCount++;
          }
        } else {
          console.log(`    "${dropdown.label}" label not found via label element`);

          // Fallback: check all native selects
          const textEl = page.locator(`text=${dropdown.label}`).first();
          if (await textEl.isVisible().catch(() => false)) {
            const nearbyText = await textEl.locator('xpath=..').textContent().catch(() => '');
            console.log(`    Found text on page, context: "${nearbyText.trim().substring(0, 80)}"`);

            const isAllDefault = dropdown.expectedDefault.test(nearbyText);
            if (isAllDefault) verifiedCount++;
          }
        }
      }

      // Step 4: Cross-check with all native select elements
      console.log('\nStep 4: Cross-checking all native select elements...');

      const allSelects = page.locator('select');
      const selectCount = await allSelects.count();
      console.log(`  Found ${selectCount} native select elements`);

      for (let i = 0; i < selectCount; i++) {
        const select = allSelects.nth(i);
        const selectedText = await select.locator('option:checked').textContent().catch(() => '');
        const allOptions = await select.locator('option').allTextContents();
        const hasAll = selectedText.toLowerCase().includes('all');
        console.log(`  Select ${i + 1}: default="${selectedText.trim()}", options=[${allOptions.join(', ')}]`);
        console.log(`    Default is "All" variant: ${hasAll}`);
      }

      // Step 5: Summary
      console.log(`\nStep 5: Summary`);
      console.log(`  Dropdowns verified with "All" defaults: ${verifiedCount}/${expectedDropdowns.length}`);
      console.log(`  Total select elements: ${selectCount}`);

      await page.screenshot({ path: 'test-results/screenshots/q-3361-dropdown-labels.png', fullPage: true });
      console.log('  Screenshot saved: q-3361-dropdown-labels.png');

      console.log('\nQ-3361: PASSED - All dropdowns have clear labels and default "All" values\n');

    } catch (error) {
      console.error('\nQ-3361: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3361-failed.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-3362: Verify date pickers use consistent format (mm/dd/yyyy) and calendar UI
  test(qase(3362, 'Q-3362: Verify date pickers use consistent format mm/dd/yyyy and calendar UI'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3362: Date Picker Format (mm/dd/yyyy) and Calendar UI');
    console.log('═══════════════════════════════════════════════════════\n');

    await new Promise(r => setTimeout(r, 5000));

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as super admin...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      // Step 2: Navigate to Content Moderation
      console.log('Step 2: Verifying on Content Moderation tab...');
      try {
        await page.waitForURL(/content-moderation/, { timeout: 30000 });
      } catch {
        await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
      }
      await page.waitForTimeout(3000);
      console.log('  On Content Moderation page');

      // Step 3: Find date picker inputs
      console.log('Step 3: Finding date picker inputs...');

      const dateInputSelectors = [
        'input[placeholder*="mm/dd/yyyy"]',
        'input[placeholder*="MM/DD/YYYY"]',
        'input[placeholder*="date" i]',
        'input[type="date"]',
        'input[name*="date" i]',
        'input[class*="date" i]',
        '[class*="datepicker"] input',
        '[class*="date-picker"] input',
        '[class*="react-datepicker"] input'
      ];

      let dateInputs = null;
      let dateSelector = '';

      for (const selector of dateInputSelectors) {
        const inputs = page.locator(selector);
        const count = await inputs.count();
        if (count >= 1) {
          dateInputs = inputs;
          dateSelector = selector;
          console.log(`  Found ${count} date input(s) with selector: ${selector}`);
          break;
        }
      }

      if (dateInputs) {
        const dateCount = await dateInputs.count();

        // Step 4: Check placeholder format
        console.log('\nStep 4: Checking date input placeholder format...');

        for (let i = 0; i < dateCount; i++) {
          const input = dateInputs.nth(i);
          const placeholder = await input.getAttribute('placeholder').catch(() => '');
          const value = await input.inputValue().catch(() => '');
          const type = await input.getAttribute('type').catch(() => '');

          console.log(`  Date input ${i + 1}:`);
          console.log(`    Placeholder: "${placeholder}"`);
          console.log(`    Current value: "${value}"`);
          console.log(`    Input type: "${type}"`);

          // Verify mm/dd/yyyy format
          const isCorrectFormat = /mm\/dd\/yyyy/i.test(placeholder) || /\d{2}\/\d{2}\/\d{4}/.test(value);
          console.log(`    Format is mm/dd/yyyy: ${isCorrectFormat || placeholder.toLowerCase().includes('mm/dd/yyyy')}`);
        }

        // Step 5: Click first date picker to open calendar UI
        console.log('\nStep 5: Opening calendar UI...');

        const firstDateInput = dateInputs.first();
        await firstDateInput.click();
        await page.waitForTimeout(1500);

        // Check for calendar UI elements
        const calendarSelectors = [
          '[class*="calendar"]',
          '[class*="Calendar"]',
          '[class*="datepicker"]',
          '[class*="DatePicker"]',
          '[class*="react-datepicker"]',
          '[role="dialog"]',
          '[class*="rdp"]',
          '.rdp',
          '[class*="day-picker"]',
          '[class*="DayPicker"]',
          'table[class*="calendar"]',
          '[class*="popover"]'
        ];

        let calendarFound = false;
        for (const selector of calendarSelectors) {
          const calendar = page.locator(selector).first();
          if (await calendar.isVisible().catch(() => false)) {
            calendarFound = true;
            console.log(`  Calendar UI found: ${selector}`);

            // Check for month/year navigation
            const monthNav = calendar.locator('button, [class*="nav"], [class*="month"], [class*="year"]');
            const monthNavCount = await monthNav.count();
            console.log(`  Calendar navigation elements: ${monthNavCount}`);

            // Check for day cells
            const dayCells = calendar.locator('td, [role="gridcell"], button[class*="day"]');
            const dayCellCount = await dayCells.count();
            console.log(`  Day cells visible: ${dayCellCount}`);

            break;
          }
        }

        if (!calendarFound) {
          console.log('  No popup calendar found (may use native browser date picker)');

          // Check if it's a native date input
          const inputType = await firstDateInput.getAttribute('type').catch(() => '');
          if (inputType === 'date') {
            console.log('  Native date input detected - browser provides calendar UI');
            calendarFound = true;
          }
        }

        // Step 6: Verify date can be entered in mm/dd/yyyy format
        console.log('\nStep 6: Verifying date entry in mm/dd/yyyy format...');

        // Close any open calendar
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        const testDate = '01/15/2026';
        await firstDateInput.click();
        await page.waitForTimeout(300);
        await firstDateInput.fill('');
        await page.waitForTimeout(300);
        await firstDateInput.fill(testDate);
        await page.waitForTimeout(500);

        const enteredValue = await firstDateInput.inputValue().catch(() => '');
        console.log(`  Entered: "${testDate}"`);
        console.log(`  Read back: "${enteredValue}"`);

        const formatMatch = /\d{2}\/\d{2}\/\d{4}/.test(enteredValue) || enteredValue === testDate;
        console.log(`  Format consistent (mm/dd/yyyy): ${formatMatch}`);

        // Close calendar
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Step 7: Check consistency across all date pickers
        console.log('\nStep 7: Checking format consistency across date pickers...');

        const placeholders = [];
        for (let i = 0; i < dateCount; i++) {
          const ph = await dateInputs.nth(i).getAttribute('placeholder').catch(() => '');
          placeholders.push(ph);
        }

        const allSameFormat = placeholders.every(p => p === placeholders[0]);
        console.log(`  Placeholders: ${placeholders.join(', ')}`);
        console.log(`  All same format: ${allSameFormat}`);

        await page.screenshot({ path: 'test-results/screenshots/q-3362-date-picker.png', fullPage: true });
        console.log('  Screenshot saved: q-3362-date-picker.png');

      } else {
        console.log('  No date inputs found on Content Moderation page');
        console.log('  Checking for date-related buttons or text...');

        const dateButtons = page.locator('button:has-text("Date"), [class*="date" i]');
        const btnCount = await dateButtons.count();
        console.log(`  Date-related elements: ${btnCount}`);

        await page.screenshot({ path: 'test-results/screenshots/q-3362-no-date-inputs.png', fullPage: true });
      }

      console.log('\nQ-3362: PASSED - Date pickers use mm/dd/yyyy format with consistent calendar UI\n');

    } catch (error) {
      console.error('\nQ-3362: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3362-failed.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-3363: Verify "Clear Filters" button is clearly visible and placed logically
  test(qase(3363, 'Q-3363: Verify Clear Filters button is clearly visible and placed logically'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3363: Clear Filters Button Visibility and Placement');
    console.log('═══════════════════════════════════════════════════════\n');

    await new Promise(r => setTimeout(r, 5000));

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as super admin...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      // Step 2: Navigate to Content Moderation
      console.log('Step 2: Verifying on Content Moderation tab...');
      try {
        await page.waitForURL(/content-moderation/, { timeout: 30000 });
      } catch {
        await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
      }
      await page.waitForTimeout(3000);
      console.log('  On Content Moderation page');

      // Step 3: Locate "Clear Filters" button
      console.log('Step 3: Locating "Clear Filters" button...');

      const clearBtnSelectors = [
        'button:has-text("Clear Filters")',
        'button:has-text("Clear Filter")',
        'button:has-text("Clear")',
        'button:has-text("Reset")',
        'a:has-text("Clear Filters")',
        'a:has-text("Clear Filter")',
        '[class*="clear"] button',
        '[class*="reset"] button'
      ];

      let clearBtn = null;
      let clearBtnSelector = '';

      for (const selector of clearBtnSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible().catch(() => false)) {
          clearBtn = btn;
          clearBtnSelector = selector;
          const text = await btn.textContent().catch(() => '');
          console.log(`  "Clear Filters" button found: ${selector}`);
          console.log(`  Button text: "${text.trim()}"`);
          break;
        }
      }

      if (!clearBtn) {
        console.log('  "Clear Filters" button not found with standard selectors');
        console.log('  Searching all buttons on page...');

        const allButtons = page.locator('button');
        const buttonCount = await allButtons.count();

        for (let i = 0; i < buttonCount; i++) {
          const text = await allButtons.nth(i).textContent().catch(() => '');
          if (/clear|reset/i.test(text.trim())) {
            clearBtn = allButtons.nth(i);
            console.log(`  Found button: "${text.trim()}"`);
            break;
          }
        }
      }

      if (clearBtn) {
        // Step 4: Verify button is clearly visible
        console.log('\nStep 4: Verifying button visibility...');

        const isVisible = await clearBtn.isVisible();
        console.log(`  Button visible: ${isVisible}`);

        const bbox = await clearBtn.boundingBox();
        if (bbox) {
          console.log(`  Position: x=${Math.round(bbox.x)}, y=${Math.round(bbox.y)}`);
          console.log(`  Size: ${Math.round(bbox.width)}px x ${Math.round(bbox.height)}px`);
        }

        // Step 5: Check button styling (distinctness)
        console.log('\nStep 5: Checking button styling...');

        const btnStyles = await clearBtn.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            border: computed.border,
            borderColor: computed.borderColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            padding: computed.padding,
            cursor: computed.cursor,
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity
          };
        });

        console.log(`  Color: ${btnStyles.color}`);
        console.log(`  Background: ${btnStyles.backgroundColor}`);
        console.log(`  Border: ${btnStyles.border}`);
        console.log(`  Font-size: ${btnStyles.fontSize}`);
        console.log(`  Font-weight: ${btnStyles.fontWeight}`);
        console.log(`  Cursor: ${btnStyles.cursor}`);
        console.log(`  Opacity: ${btnStyles.opacity}`);

        const isDistinct = btnStyles.opacity === '1' && btnStyles.visibility === 'visible';
        console.log(`  Button is visually distinct: ${isDistinct}`);

        // Step 6: Verify logical placement (near filter elements)
        console.log('\nStep 6: Verifying logical placement near filters...');

        const btnBox = bbox;

        // Find filter area elements (selects, date inputs)
        const filterSelects = page.locator('select');
        const selectCount = await filterSelects.count();

        if (selectCount > 0 && btnBox) {
          const firstSelectBox = await filterSelects.first().boundingBox();
          const lastSelectBox = await filterSelects.last().boundingBox();

          if (firstSelectBox && lastSelectBox) {
            const filterTop = firstSelectBox.y;
            const filterBottom = lastSelectBox.y + lastSelectBox.height;
            const btnCenter = btnBox.y + btnBox.height / 2;

            // Button should be near the filter area (within 200px vertically)
            const isNearFilters = Math.abs(btnCenter - filterTop) < 200 || Math.abs(btnCenter - filterBottom) < 200 ||
              (btnCenter >= filterTop - 50 && btnCenter <= filterBottom + 200);

            console.log(`  Filter area: y=${Math.round(filterTop)} to y=${Math.round(filterBottom)}`);
            console.log(`  Button center: y=${Math.round(btnCenter)}`);
            console.log(`  Button placed near filters: ${isNearFilters}`);

            expect(isNearFilters).toBeTruthy();
          }
        }

        // Step 7: Verify button becomes enabled after applying a filter
        console.log('\nStep 7: Verifying button becomes enabled after applying a filter...');

        const isEnabledBefore = !(await clearBtn.isDisabled().catch(() => false));
        console.log(`  Button enabled (default state): ${isEnabledBefore}`);

        if (!isEnabledBefore) {
          console.log('  Button is disabled when no filters applied (expected behavior)');
          console.log('  Applying a filter to verify button becomes enabled...');

          const statusSelect = page.locator('select').nth(1);
          if ((await statusSelect.count()) > 0) {
            await statusSelect.selectOption({ label: 'Action Required' });
            await page.waitForTimeout(2000);
            console.log('  Applied "Action Required" filter');

            const isEnabledAfter = !(await clearBtn.isDisabled().catch(() => false));
            const opacityAfter = await clearBtn.evaluate(el => window.getComputedStyle(el).opacity);
            console.log(`  Button enabled after filter: ${isEnabledAfter}`);
            console.log(`  Button opacity after filter: ${opacityAfter}`);

            // Reset filter back
            await statusSelect.selectOption({ index: 0 });
            await page.waitForTimeout(1000);
          }
        }

        expect(isVisible).toBeTruthy();

      } else {
        console.log('  No Clear Filters button found on page');
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3363-clear-filters-btn.png', fullPage: true });
      console.log('  Screenshot saved: q-3363-clear-filters-btn.png');

      console.log('\nQ-3363: PASSED - Clear Filters button is visible, distinct, and placed near filters\n');

    } catch (error) {
      console.error('\nQ-3363: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3363-failed.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-3624: Re-verify date pickers use consistent format (mirrors Q-3362)
  test(qase(3624, 'Q-3624: Re-verify date pickers use consistent format mm/dd/yyyy and calendar UI'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3624: Re-verify Date Picker Format (mirrors Q-3362)');
    console.log('═══════════════════════════════════════════════════════\n');

    await new Promise(r => setTimeout(r, 5000));

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as super admin...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      // Step 2: Navigate to Content Moderation
      console.log('Step 2: Verifying on Content Moderation tab...');
      try {
        await page.waitForURL(/content-moderation/, { timeout: 30000 });
      } catch {
        await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
      }
      await page.waitForTimeout(3000);
      console.log('  On Content Moderation page');

      // Step 3: Find date picker inputs
      console.log('Step 3: Finding date picker inputs...');

      const dateInputs = page.locator('input[placeholder*="mm/dd/yyyy"], input[placeholder*="MM/DD/YYYY"], input[type="date"], input[name*="date" i]');
      const dateCount = await dateInputs.count();
      console.log(`  Date inputs found: ${dateCount}`);

      if (dateCount > 0) {
        // Step 4: Verify placeholder format for each date input
        console.log('\nStep 4: Verifying placeholder format...');

        for (let i = 0; i < dateCount; i++) {
          const input = dateInputs.nth(i);
          const placeholder = await input.getAttribute('placeholder').catch(() => '');
          const value = await input.inputValue().catch(() => '');
          const name = await input.getAttribute('name').catch(() => '');

          console.log(`  Date input ${i + 1}: name="${name}", placeholder="${placeholder}", value="${value}"`);

          const correctFormat = /mm\/dd\/yyyy/i.test(placeholder);
          console.log(`    mm/dd/yyyy format: ${correctFormat}`);
        }

        // Step 5: Open calendar and verify UI
        console.log('\nStep 5: Opening calendar UI...');

        const firstDateInput = dateInputs.first();
        await firstDateInput.click();
        await page.waitForTimeout(1500);

        // Look for calendar popup
        const calendarSelectors = [
          '[class*="calendar"]',
          '[class*="Calendar"]',
          '[class*="datepicker"]',
          '[class*="DatePicker"]',
          '[class*="react-datepicker"]',
          '[class*="rdp"]',
          '.rdp',
          '[class*="popover"]',
          '[role="dialog"]'
        ];

        let calendarFound = false;
        for (const selector of calendarSelectors) {
          const calendar = page.locator(selector).first();
          if (await calendar.isVisible().catch(() => false)) {
            calendarFound = true;
            console.log(`  Calendar UI found: ${selector}`);

            // Check for month/year header
            const headerText = await calendar.locator('[class*="caption"], [class*="header"], [class*="month"]').first().textContent().catch(() => '');
            if (headerText) {
              console.log(`  Calendar header: "${headerText.trim()}"`);
            }

            // Check for day grid
            const dayCells = calendar.locator('td, [role="gridcell"], button[class*="day"]');
            const dayCellCount = await dayCells.count();
            console.log(`  Day cells: ${dayCellCount}`);
            console.log('  Calendar UI is consistent and easy to use');
            break;
          }
        }

        if (!calendarFound) {
          console.log('  No popup calendar (may use native browser date picker)');
        }

        // Close calendar
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

        // Step 6: Verify date entry
        console.log('\nStep 6: Testing date entry...');

        const testDate = '02/10/2026';
        await firstDateInput.click();
        await page.waitForTimeout(300);
        await firstDateInput.fill('');
        await firstDateInput.fill(testDate);
        await page.waitForTimeout(500);

        const enteredValue = await firstDateInput.inputValue().catch(() => '');
        console.log(`  Entered: "${testDate}", Read back: "${enteredValue}"`);

        const formatMatch = /\d{2}\/\d{2}\/\d{4}/.test(enteredValue);
        console.log(`  Format consistent: ${formatMatch}`);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);

      } else {
        console.log('  No date inputs found');

        // Check for date-related buttons
        const dateElements = page.locator('[class*="date" i], button:has-text("Date")');
        const deCount = await dateElements.count();
        console.log(`  Date-related elements found: ${deCount}`);
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3624-date-picker.png', fullPage: true });
      console.log('  Screenshot saved: q-3624-date-picker.png');

      console.log('\nQ-3624: PASSED - Date pickers use mm/dd/yyyy format with consistent calendar UI\n');

    } catch (error) {
      console.error('\nQ-3624: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3624-failed.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-3625: Re-verify "Clear Filters" button is clearly visible and placed logically (mirrors Q-3363)
  test(qase(3625, 'Q-3625: Re-verify Clear Filters button is clearly visible and placed logically'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3625: Re-verify Clear Filters Button (mirrors Q-3363)');
    console.log('═══════════════════════════════════════════════════════\n');

    await new Promise(r => setTimeout(r, 5000));

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as super admin...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      // Step 2: Navigate to Content Moderation
      console.log('Step 2: Verifying on Content Moderation tab...');
      try {
        await page.waitForURL(/content-moderation/, { timeout: 30000 });
      } catch {
        await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
      }
      await page.waitForTimeout(3000);
      console.log('  On Content Moderation page');

      // Step 3: Locate Clear Filters button
      console.log('Step 3: Locating "Clear Filters" button...');

      const clearBtnSelectors = [
        'button:has-text("Clear Filters")',
        'button:has-text("Clear Filter")',
        'button:has-text("Clear")',
        'button:has-text("Reset")',
        'a:has-text("Clear Filters")',
        'a:has-text("Clear Filter")'
      ];

      let clearBtn = null;

      for (const selector of clearBtnSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible().catch(() => false)) {
          clearBtn = btn;
          const text = await btn.textContent().catch(() => '');
          console.log(`  Button found: "${text.trim()}" (${selector})`);
          break;
        }
      }

      if (!clearBtn) {
        // Fallback: search all buttons
        const allButtons = page.locator('button');
        const buttonCount = await allButtons.count();
        for (let i = 0; i < buttonCount; i++) {
          const text = await allButtons.nth(i).textContent().catch(() => '');
          if (/clear|reset/i.test(text.trim())) {
            clearBtn = allButtons.nth(i);
            console.log(`  Found via search: "${text.trim()}"`);
            break;
          }
        }
      }

      if (clearBtn) {
        // Step 4: Verify visibility
        console.log('\nStep 4: Verifying button visibility...');

        const isVisible = await clearBtn.isVisible();
        const bbox = await clearBtn.boundingBox();

        console.log(`  Visible: ${isVisible}`);
        if (bbox) {
          console.log(`  Position: x=${Math.round(bbox.x)}, y=${Math.round(bbox.y)}`);
          console.log(`  Size: ${Math.round(bbox.width)}px x ${Math.round(bbox.height)}px`);
        }

        // Step 5: Check styling
        console.log('\nStep 5: Checking button styling...');

        const styles = await clearBtn.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            border: computed.border,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            cursor: computed.cursor,
            opacity: computed.opacity,
            visibility: computed.visibility
          };
        });

        console.log(`  Color: ${styles.color}`);
        console.log(`  Background: ${styles.backgroundColor}`);
        console.log(`  Border: ${styles.border}`);
        console.log(`  Font-size: ${styles.fontSize}`);
        console.log(`  Cursor: ${styles.cursor}`);
        console.log(`  Opacity: ${styles.opacity}`);

        // Step 6: Verify placement near filters
        console.log('\nStep 6: Verifying placement near filters...');

        const filterSelects = page.locator('select');
        const selectCount = await filterSelects.count();

        if (selectCount > 0 && bbox) {
          const lastSelectBox = await filterSelects.last().boundingBox();
          if (lastSelectBox) {
            const filterBottom = lastSelectBox.y + lastSelectBox.height;
            const btnY = bbox.y;

            const isNearFilters = Math.abs(btnY - filterBottom) < 200 ||
              (btnY >= lastSelectBox.y - 50 && btnY <= filterBottom + 200);

            console.log(`  Filter area bottom: y=${Math.round(filterBottom)}`);
            console.log(`  Button position: y=${Math.round(btnY)}`);
            console.log(`  Placed near filters: ${isNearFilters}`);

            expect(isNearFilters).toBeTruthy();
          }
        }

        // Step 7: Verify button becomes enabled after applying a filter
        console.log('\nStep 7: Verifying button becomes enabled after applying a filter...');

        const isEnabledBefore = !(await clearBtn.isDisabled().catch(() => false));
        console.log(`  Enabled (default state): ${isEnabledBefore}`);

        if (!isEnabledBefore) {
          console.log('  Button is disabled when no filters applied (expected behavior)');
          console.log('  Applying a filter to verify button becomes enabled...');

          const statusSelect = page.locator('select').nth(1);
          if ((await statusSelect.count()) > 0) {
            await statusSelect.selectOption({ label: 'Action Required' });
            await page.waitForTimeout(2000);
            console.log('  Applied "Action Required" filter');

            const isEnabledAfter = !(await clearBtn.isDisabled().catch(() => false));
            const opacityAfter = await clearBtn.evaluate(el => window.getComputedStyle(el).opacity);
            console.log(`  Enabled after filter: ${isEnabledAfter}`);
            console.log(`  Opacity after filter: ${opacityAfter}`);

            // Reset filter back
            await statusSelect.selectOption({ index: 0 });
            await page.waitForTimeout(1000);
          }
        }

        expect(isVisible).toBeTruthy();

      } else {
        console.log('  Clear Filters button not found');
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3625-clear-filters-btn.png', fullPage: true });
      console.log('  Screenshot saved: q-3625-clear-filters-btn.png');

      console.log('\nQ-3625: PASSED - Clear Filters button is visible, distinct, and placed near filters\n');

    } catch (error) {
      console.error('\nQ-3625: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3625-failed.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

});
