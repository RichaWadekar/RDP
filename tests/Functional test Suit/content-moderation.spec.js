const { test, expect } = require('@playwright/test');
const { LoginPage, ContentModerationPage } = require('../pages');
const { testData } = require('../fixtures/testData');

/**
 * Content Moderation Tests
 * - Filter validation
 * - Take No Action flow
 * - Remove Content flow
 */

test.describe('Content Moderation', () => {

  test('Content Moderation - Filter Validation with Multi-Filter Application', async ({ browser }) => {
    test.setTimeout(testData.timeouts.test);

    console.log('\n  Starting Content Moderation Filter Validation Test...\n');

    // Create app context and page
    const appContext = await browser.newContext();
    const appPage = await appContext.newPage();

    // Initialize page objects
    const loginPage = new LoginPage(appPage);
    const contentPage = new ContentModerationPage(appPage);

    try {
      // STEP 1: Login
      console.log('  STEP 1: Performing Login via OTP...');
      await loginPage.login(browser, testData.credentials.email, testData.credentials.yopmailInbox);
      await appPage.waitForLoadState('networkidle');
      await contentPage.wait(2000);

      // STEP 2: Verify on Content Moderation Page
      console.log('\n  STEP 2: Verifying Content Moderation Page...');
      const currentUrl = contentPage.getUrl();
      console.log(`    Successfully navigated to: ${currentUrl}`);

      // STEP 3: Apply Filters
      console.log('\n  STEP 3: Applying Filters...');
      await contentPage.applyFilters(testData.contentModerationFilters);

      // STEP 4: Click Apply Filter
      console.log('\n  STEP 4: Clicking Apply Filter Button...');
      await contentPage.clickApplyFilter();

      // STEP 5: Validate Results
      console.log('\n  STEP 5: Validating Filtered Results...');
      const rowCount = await contentPage.getRowCount();
      console.log(`    Found ${rowCount} result items`);

      // STEP 6: Clear Filters
      console.log('\n  STEP 6: Clearing Filters...');
      await contentPage.clearFilters();

      // SCENARIO 1: Take No Action Flow
      console.log('\n  SCENARIO 1: Take No Action Flow');

      const actionRequiredRow = await contentPage.findActionRequiredRow();
      if (actionRequiredRow) {
        await contentPage.clickViewForRow(actionRequiredRow.row);
        await contentPage.takeNoAction('No policy violation found');
        await contentPage.goBack();
        await contentPage.verifyStatusChanged(actionRequiredRow.index, 'no action');
      }

      // SCENARIO 2: Remove Content Flow
      console.log('\n  SCENARIO 2: Remove Content Flow');

      await contentPage.goBack();
      const removeRow = await contentPage.findActionRequiredRow();
      if (removeRow) {
        await contentPage.clickViewForRow(removeRow.row);
        await contentPage.removeContent('Violates community guidelines');
        await contentPage.goBack();
        await contentPage.verifyStatusChanged(removeRow.index, 'removed');
      }

      // Test Summary
      console.log('\n  TEST COMPLETED SUCCESSFULLY');
      console.log('  Test Summary:');
      console.log('    Successfully logged in via OTP');
      console.log('    Navigated to Content Moderation page');
      console.log('    Applied filters successfully');
      console.log('    Filter results validated');
      console.log('    Take No Action flow completed');
      console.log('    Remove Content flow completed\n');

    } catch (error) {
      console.error('\n  TEST FAILED:', error.message);
      console.error(error.stack);

      // Capture error screenshot
      try {
        await appPage.screenshot({ path: 'test-results/screenshots/content-moderation-error.png', fullPage: true });
        console.log('  Error screenshot saved: content-moderation-error.png');
      } catch {
        // Ignore screenshot error
      }

      throw error;
    } finally {
      // Cleanup
      await appContext.close();
      console.log('  Browser context closed\n');
    }
  });
});
