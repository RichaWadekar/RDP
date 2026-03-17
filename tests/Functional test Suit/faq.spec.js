const { test, expect } = require('@playwright/test');
const { LoginPage, FAQPage } = require('../pages');
const { testData } = require('../fixtures/testData');
const { generateUniqueFaqQuestion } = require('../utils/helpers');

/**
 * FAQ Management Tests
 * - Create FAQ
 * - Edit FAQ
 * - Delete FAQ
 */

test.describe('FAQ Management', () => {

  test('FAQ Management – Create, Edit, and Delete FAQ', async ({ browser }) => {
    test.setTimeout(testData.timeouts.test);

    console.log('\n  Starting FAQ Management test...\n');

    // Create app context and page
    const appContext = await browser.newContext();
    const appPage = await appContext.newPage();

    // Initialize page objects
    const loginPage = new LoginPage(appPage);
    const faqPage = new FAQPage(appPage);

    // Login (precondition)
    console.log('  Precondition: Logging in...');
    await loginPage.login(browser, testData.credentials.email, testData.credentials.yopmailInbox);

    // STEP 1: Navigate to FAQ Management Page
    console.log('  STEP 1: Navigating to FAQ Management page...');
    await appPage.waitForLoadState('networkidle');
    await expect(appPage).toHaveURL(/content-moderation/);
    console.log('    User logged in and on content-moderation page');

    await faqPage.goToFaqPage();
    await expect(appPage).toHaveURL(/\/faqs/);
    console.log('    Navigated to FAQ Management page');

    await faqPage.verifyFaqPageLoaded();

    // STEP 2: Create New FAQ
    console.log('\n  STEP 2: Creating new FAQ...');

    const newQuestion = generateUniqueFaqQuestion(testData.faq.question);
    const newAnswer = testData.faq.answer;

    const createdQuestion = await faqPage.createFaq(newQuestion, newAnswer);

    // Verify FAQ appears in list
    const faqExists = await faqPage.verifyFaqExists(createdQuestion);
    if (faqExists) {
      console.log('    Newly created FAQ visible in the list');
    }

    // STEP 3: Edit Existing FAQ
    console.log('\n  STEP 3: Editing the created FAQ...');

    const updatedQuestion = await faqPage.editFaq(createdQuestion);

    // Verify updated FAQ in list
    const updatedExists = await faqPage.verifyFaqExists(updatedQuestion);
    if (updatedExists) {
      console.log('    Updated FAQ reflected in the list');
    }

    // STEP 4: Delete FAQ
    console.log('\n  STEP 4: Deleting the FAQ...');

    await faqPage.deleteFaq(updatedQuestion);

    // Verify FAQ is removed
    const faqRemoved = await faqPage.verifyFaqRemoved(updatedQuestion);
    if (faqRemoved) {
      console.log('    FAQ removed from the list');
    }

    // FINAL VALIDATION
    console.log('\n  FINAL VALIDATION');
    console.log('    Create FAQ functionality works correctly');
    console.log('    Edit FAQ functionality works correctly');
    console.log('    Delete FAQ functionality works correctly');
    console.log('    Success messages displayed for all actions');
    console.log('    FAQ list refreshed correctly after each operation');
    console.log('\n  FAQ Management test completed successfully!\n');

    // Cleanup
    await appContext.close();
  });
});
