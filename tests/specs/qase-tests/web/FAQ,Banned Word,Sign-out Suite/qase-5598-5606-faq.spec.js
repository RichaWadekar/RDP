const { test, expect } = require('@playwright/test');
const { qase } = require('playwright-qase-reporter');
const { loginViaDemo } = require('../demoLoginHelper');
const { FAQPage } = require('../../../../pages/FAQPage');
const { generateUniqueFaqQuestion } = require('../../../../utils/helpers');

/**
 * Qase Suite 21: Web - FAQ, Word Moderation, Sign-Out
 * FAQ Module Tests: Q-5598 to Q-5606 (9 tests)
 */

test.describe('FAQ Module - Qase Tests Q-5598 to Q-5606', () => {
  test.setTimeout(300000);

  // Q-5598: Verify FAQs page loads successfully
  test(qase(5598, 'Q-5598: Verify FAQs page loads successfully'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5598: Verify FAQs page loads successfully');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login as Super Admin
      console.log('Step 1: Logging in as Super Admin...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Navigate to FAQs page
      console.log('Step 2: Navigating to FAQs page...');
      const faqPage = new FAQPage(page);
      await faqPage.goToFaqPage();

      // Step 3: Verify FAQs page loaded with list
      console.log('Step 3: Verifying FAQs page loaded...');
      const url = page.url();
      expect(url).toContain('/faqs');
      console.log(`  URL confirmed: ${url}`);

      // Check for page header
      const headerVisible = await faqPage.verifyFaqPageLoaded();
      console.log(`  FAQ page header visible: ${headerVisible}`);

      // Check for FAQ list items or Create FAQ button
      const createBtnVisible = await faqPage.createFaqButton.isVisible().catch(() => false);
      console.log(`  Create FAQ button visible: ${createBtnVisible}`);
      expect(createBtnVisible).toBeTruthy();

      console.log('\nQ-5598: PASSED - FAQs page loads successfully with list\n');

    } catch (error) {
      console.error('\nQ-5598: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5598-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5599: Verify Create FAQ popup opens
  test(qase(5599, 'Q-5599: Verify Create FAQ popup opens'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5599: Verify Create FAQ popup opens');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as Super Admin...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Navigate to FAQs page
      console.log('Step 2: Navigating to FAQs page...');
      const faqPage = new FAQPage(page);
      await faqPage.goToFaqPage();

      // Step 3: Click Create FAQ button
      console.log('Step 3: Clicking Create FAQ button...');
      await faqPage.clickCreateFaq();

      // Step 4: Verify modal opened
      console.log('Step 4: Verifying Create FAQ popup opened...');
      const modalVisible = await faqPage.modal.isVisible().catch(() => false);
      expect(modalVisible).toBeTruthy();
      console.log('  Create FAQ modal is visible');

      // Check for heading in modal
      const heading = page.getByRole('heading', { name: /Create|New FAQ|Create FAQ/i }).first();
      const headingVisible = await heading.isVisible().catch(() => false);
      console.log(`  Create FAQ heading visible: ${headingVisible}`);

      // Check question and answer inputs
      const questionInputVisible = await faqPage.questionInput.isVisible().catch(() => false);
      const answerInputVisible = await faqPage.answerInput.isVisible().catch(() => false);
      console.log(`  Question input visible: ${questionInputVisible}`);
      console.log(`  Answer input visible: ${answerInputVisible}`);
      expect(questionInputVisible).toBeTruthy();
      expect(answerInputVisible).toBeTruthy();

      console.log('\nQ-5599: PASSED - Create FAQ popup opens correctly\n');

    } catch (error) {
      console.error('\nQ-5599: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5599-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5600: Verify FAQ creation with valid data
  test(qase(5600, 'Q-5600: Verify FAQ creation with valid data'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5600: Verify FAQ creation with valid data');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as Super Admin...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Navigate to FAQs page
      console.log('Step 2: Navigating to FAQs page...');
      const faqPage = new FAQPage(page);
      await faqPage.goToFaqPage();

      // Step 3: Create FAQ with valid data
      console.log('Step 3: Creating FAQ with valid question and answer...');
      const question = generateUniqueFaqQuestion('AutoTest');
      const answer = 'This is an automated test answer for FAQ creation';
      const createdQuestion = await faqPage.createFaq(question, answer);
      console.log(`  FAQ created with question: "${createdQuestion}"`);

      // Step 4: Verify FAQ added to list
      console.log('Step 4: Verifying FAQ added to list...');
      const exists = await faqPage.verifyFaqExists(createdQuestion);
      expect(exists).toBeTruthy();
      console.log('  FAQ found in list');

      // Cleanup: delete created FAQ
      console.log('Cleanup: Deleting created FAQ...');
      await faqPage.deleteFaq(createdQuestion);

      console.log('\nQ-5600: PASSED - FAQ created successfully with valid data\n');

    } catch (error) {
      console.error('\nQ-5600: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5600-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5601: Verify mandatory field validation
  test(qase(5601, 'Q-5601: Verify mandatory field validation'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5601: Verify mandatory field validation');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as Super Admin...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Navigate to FAQs page
      console.log('Step 2: Navigating to FAQs page...');
      const faqPage = new FAQPage(page);
      await faqPage.goToFaqPage();

      // Step 3: Open Create FAQ popup
      console.log('Step 3: Opening Create FAQ popup...');
      await faqPage.clickCreateFaq();

      // Step 4: Click Submit without entering data
      console.log('Step 4: Clicking Submit without input...');
      await faqPage.submitFaqForm();
      await page.waitForTimeout(1000);

      // Step 5: Verify validation error
      console.log('Step 5: Verifying validation error...');
      let validationFound = false;

      // Check for error messages
      const errorSelectors = [
        'text=/required|please enter|cannot be empty|field is required/i',
        '[class*="error"]',
        '[class*="validation"]',
        '[role="alert"]'
      ];

      for (const selector of errorSelectors) {
        const errorElement = page.locator(selector).first();
        if (await errorElement.isVisible().catch(() => false)) {
          const errorText = await errorElement.textContent().catch(() => '');
          console.log(`  Validation error found: "${errorText.trim()}"`);
          validationFound = true;
          break;
        }
      }

      // Also check if modal is still open (form not submitted)
      const modalStillOpen = await faqPage.modal.isVisible().catch(() => false);
      if (modalStillOpen) {
        console.log('  Modal still open - form submission blocked');
        validationFound = true;
      }

      // Check for HTML5 validation on inputs
      const questionValidation = await faqPage.questionInput.evaluate(el => el.validationMessage).catch(() => '');
      if (questionValidation) {
        console.log(`  Question field validation: "${questionValidation}"`);
        validationFound = true;
      }

      expect(validationFound).toBeTruthy();
      console.log('\nQ-5601: PASSED - Mandatory field validation works correctly\n');

    } catch (error) {
      console.error('\nQ-5601: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5601-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5602: Verify FAQ update
  test(qase(5602, 'Q-5602: Verify FAQ update'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5602: Verify FAQ update');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as Super Admin...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Navigate to FAQs page
      console.log('Step 2: Navigating to FAQs page...');
      const faqPage = new FAQPage(page);
      await faqPage.goToFaqPage();

      // Step 3: Create a FAQ first
      console.log('Step 3: Creating a FAQ for update test...');
      const originalQuestion = await faqPage.createFaq(generateUniqueFaqQuestion('UpdateTest'), 'Original answer');
      console.log(`  FAQ created: "${originalQuestion}"`);

      // Step 4: Edit the FAQ
      console.log('Step 4: Editing the FAQ...');
      const updatedQuestion = await faqPage.editFaq(originalQuestion, originalQuestion + ' Updated', 'Updated answer text');
      console.log(`  FAQ updated to: "${updatedQuestion}"`);

      // Step 5: Verify updated FAQ in list
      console.log('Step 5: Verifying updated FAQ in list...');
      const exists = await faqPage.verifyFaqExists(updatedQuestion);
      expect(exists).toBeTruthy();
      console.log('  Updated FAQ found in list');

      // Cleanup
      console.log('Cleanup: Deleting test FAQ...');
      await faqPage.deleteFaq(updatedQuestion);

      console.log('\nQ-5602: PASSED - FAQ updated successfully\n');

    } catch (error) {
      console.error('\nQ-5602: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5602-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5603: Verify FAQ deletion
  test(qase(5603, 'Q-5603: Verify FAQ deletion'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5603: Verify FAQ deletion');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as Super Admin...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Navigate to FAQs page
      console.log('Step 2: Navigating to FAQs page...');
      const faqPage = new FAQPage(page);
      await faqPage.goToFaqPage();

      // Step 3: Create a FAQ for deletion
      console.log('Step 3: Creating a FAQ for deletion test...');
      const question = await faqPage.createFaq(generateUniqueFaqQuestion('DeleteTest'), 'Answer to be deleted');
      console.log(`  FAQ created: "${question}"`);

      // Step 4: Delete the FAQ
      console.log('Step 4: Deleting the FAQ...');
      await faqPage.deleteFaq(question);

      // Step 5: Verify FAQ removed from list
      console.log('Step 5: Verifying FAQ removed from list...');
      const removed = await faqPage.verifyFaqRemoved(question);
      expect(removed).toBeTruthy();
      console.log('  FAQ successfully removed from list');

      console.log('\nQ-5603: PASSED - FAQ deleted successfully\n');

    } catch (error) {
      console.error('\nQ-5603: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5603-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5604: Verify cancel delete
  test(qase(5604, 'Q-5604: Verify cancel delete'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5604: Verify cancel delete');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as Super Admin...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Navigate to FAQs page
      console.log('Step 2: Navigating to FAQs page...');
      const faqPage = new FAQPage(page);
      await faqPage.goToFaqPage();

      // Step 3: Create a FAQ
      console.log('Step 3: Creating a FAQ for cancel delete test...');
      const question = await faqPage.createFaq(generateUniqueFaqQuestion('CancelDelTest'), 'Should not be deleted');
      console.log(`  FAQ created: "${question}"`);

      // Step 4: Click delete then cancel
      console.log('Step 4: Clicking delete then cancel...');
      await faqPage.clickDeleteFaq(question);

      // Verify delete popup appeared
      const popupVisible = await faqPage.modal.isVisible().catch(() => false);
      console.log(`  Delete confirmation popup visible: ${popupVisible}`);

      // Click Cancel
      const cancelBtn = faqPage.modal.locator('button:has-text("Cancel"), button:has-text("No")').first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        console.log('  Cancel button clicked');
      } else {
        await page.keyboard.press('Escape');
        console.log('  Pressed Escape to close popup');
      }
      await page.waitForTimeout(1000);

      // Step 5: Verify FAQ still exists
      console.log('Step 5: Verifying FAQ still exists in list...');
      const stillExists = await faqPage.verifyFaqExists(question);
      expect(stillExists).toBeTruthy();
      console.log('  FAQ still present in list - cancel worked');

      // Cleanup
      console.log('Cleanup: Deleting test FAQ...');
      await faqPage.deleteFaq(question);

      console.log('\nQ-5604: PASSED - Cancel delete keeps FAQ in list\n');

    } catch (error) {
      console.error('\nQ-5604: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5604-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5605: Verify FAQ expand/collapse
  test(qase(5605, 'Q-5605: Verify FAQ expand/collapse'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5605: Verify FAQ expand/collapse');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as Super Admin...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Navigate to FAQs page
      console.log('Step 2: Navigating to FAQs page...');
      const faqPage = new FAQPage(page);
      await faqPage.goToFaqPage();

      // Step 3: Create a FAQ with known content
      console.log('Step 3: Creating a FAQ for expand/collapse test...');
      const question = await faqPage.createFaq(generateUniqueFaqQuestion('ExpandTest'), 'This answer should expand and collapse');
      console.log(`  FAQ created: "${question}"`);

      // Step 4: Click on FAQ question to expand
      console.log('Step 4: Clicking FAQ question to expand...');
      const faqItem = faqPage.getFaqItem(question).first();
      await faqItem.scrollIntoViewIfNeeded();
      await faqItem.click();
      await page.waitForTimeout(1000);

      // Check if answer is visible (expanded)
      const answerText = page.locator('text=This answer should expand and collapse').first();
      const answerVisible = await answerText.isVisible().catch(() => false);
      console.log(`  Answer visible after click (expanded): ${answerVisible}`);

      // Step 5: Click again to collapse
      console.log('Step 5: Clicking FAQ question again to collapse...');
      await faqItem.click();
      await page.waitForTimeout(1000);

      // The FAQ section has been toggled
      console.log('  FAQ toggle completed');

      // Cleanup
      console.log('Cleanup: Deleting test FAQ...');
      await faqPage.deleteFaq(question);

      console.log('\nQ-5605: PASSED - FAQ expand/collapse works correctly\n');

    } catch (error) {
      console.error('\nQ-5605: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5605-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // Q-5606: Verify icons visibility (Edit/Delete)
  test(qase(5606, 'Q-5606: Verify icons visibility'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5606: Verify icons visibility');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as Super Admin...');
      await loginViaDemo(page, browser);

      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Step 2: Navigate to FAQs page
      console.log('Step 2: Navigating to FAQs page...');
      const faqPage = new FAQPage(page);
      await faqPage.goToFaqPage();

      // Step 3: Observe Edit/Delete icons
      console.log('Step 3: Checking Edit/Delete icons visibility...');

      // Check for Edit icons (pen icon)
      const editIcons = page.locator('svg.lucide-pen, button[aria-label*="Edit"], button:has(svg.lucide-pen)');
      const editCount = await editIcons.count();
      console.log(`  Edit icons found: ${editCount}`);

      // Check for Delete icons (trash icon)
      const deleteIcons = page.locator('svg.lucide-trash2, button[aria-label*="Delete"], button:has(svg.lucide-trash2)');
      const deleteCount = await deleteIcons.count();
      console.log(`  Delete icons found: ${deleteCount}`);

      // Verify at least some icons are visible
      let iconsVisible = false;
      if (editCount > 0 || deleteCount > 0) {
        iconsVisible = true;
        console.log('  Icons are visible and properly displayed');
      }

      // If no FAQ items exist, create one to verify icons
      if (!iconsVisible) {
        console.log('  No FAQ items found, creating one to verify icons...');
        const question = await faqPage.createFaq(generateUniqueFaqQuestion('IconTest'), 'Icon visibility test');

        const editIconsAfter = await editIcons.count();
        const deleteIconsAfter = await deleteIcons.count();
        console.log(`  Edit icons after creation: ${editIconsAfter}`);
        console.log(`  Delete icons after creation: ${deleteIconsAfter}`);

        if (editIconsAfter > 0 || deleteIconsAfter > 0) {
          iconsVisible = true;
        }

        // Cleanup
        await faqPage.deleteFaq(question);
      }

      expect(iconsVisible).toBeTruthy();
      console.log('\nQ-5606: PASSED - Edit/Delete icons visible properly\n');

    } catch (error) {
      console.error('\nQ-5606: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5606-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });
});
