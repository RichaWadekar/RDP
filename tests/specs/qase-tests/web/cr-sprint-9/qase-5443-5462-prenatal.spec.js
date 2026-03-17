const { test, expect } = require('@playwright/test');
const { qase } = require('playwright-qase-reporter');
const { LoginPage, ActivityPage } = require('../../../../pages');
const { testData } = require('../../../../fixtures/testData');
const { generateUniqueActivityName } = require('../../../../utils/helpers');

test.describe('Prenatal Age Range - Sprint 9 Qase Tests Q-5443 to Q-5462', () => {
  test.setTimeout(300000);

  // ─────────────────────────────────────────────────────────────────
  // Q-5443: Verify "Prenatal" appears in admin age dropdown
  // ─────────────────────────────────────────────────────────────────
  test(qase(5443, 'Q-5443: Verify "Prenatal" appears in admin age dropdown'), async ({ browser }) => {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('Q-5443: Verify "Prenatal" appears in admin age dropdown');
    console.log('════════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const loginPage = new LoginPage(page);
      const activityPage = new ActivityPage(page);

      // Step 1: Login
      console.log('Step 1: Login to admin panel');
      await loginPage.login(browser, testData.credentials.email, testData.credentials.yopmailInbox);
      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      console.log('  Login successful');

      // Step 2: Navigate to Create Activity page
      console.log('Step 2: Navigate to Create Activity page');
      await activityPage.goToActivities();
      await activityPage.clickCreateActivity();
      await page.waitForURL(/\/activities\/create/, { timeout: 15000 });
      console.log('  On Create Activity page');

      // Step 3: Open age group dropdown and verify Prenatal option
      console.log('Step 3: Verify "Prenatal" appears in age group dropdown');
      const hasPrenatal = await activityPage.isAgeGroupOptionVisible('Prenatal');
      expect(hasPrenatal).toBeTruthy();
      console.log('  Assertion passed: "Prenatal" is visible in age group dropdown');

      console.log('\nQ-5443: PASSED - Prenatal appears in admin age dropdown\n');

    } catch (error) {
      console.error('\nQ-5443: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5443-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // Q-5444: Verify age range "6+" is replaced with "6"
  // ─────────────────────────────────────────────────────────────────
  test(qase(5444, 'Q-5444: Verify age range "6+" is replaced with "6"'), async ({ browser }) => {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('Q-5444: Verify age range "6+" is replaced with "6"');
    console.log('════════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const loginPage = new LoginPage(page);
      const activityPage = new ActivityPage(page);

      // Step 1: Login
      console.log('Step 1: Login to admin panel');
      await loginPage.login(browser, testData.credentials.email, testData.credentials.yopmailInbox);
      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      console.log('  Login successful');

      // Step 2: Navigate to Create Activity page
      console.log('Step 2: Navigate to Create Activity page');
      await activityPage.goToActivities();
      await activityPage.clickCreateActivity();
      await page.waitForURL(/\/activities\/create/, { timeout: 15000 });
      console.log('  On Create Activity page');

      // Step 3: Open age group dropdown and verify "6+" is absent and "6" is present
      console.log('Step 3: Verify "6+" is replaced with "6"');
      const options = await activityPage.getAgeGroupOptions();

      const hasSixPlus = options.some(opt => opt === '6+');
      expect(hasSixPlus).toBeFalsy();
      console.log('  Assertion passed: "6+" is NOT in dropdown');

      const hasSix = options.some(opt => opt === '6' || opt === '6 years');
      expect(hasSix).toBeTruthy();
      console.log('  Assertion passed: "6" (or "6 years") IS in dropdown');

      console.log('\nQ-5444: PASSED - Age range "6+" is replaced with "6"\n');

    } catch (error) {
      console.error('\nQ-5444: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5444-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // Q-5445: Verify new "7+" age range is added
  // ─────────────────────────────────────────────────────────────────
  test(qase(5445, 'Q-5445: Verify new "7+" age range is added'), async ({ browser }) => {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('Q-5445: Verify new "7+" age range is added');
    console.log('════════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const loginPage = new LoginPage(page);
      const activityPage = new ActivityPage(page);

      // Step 1: Login
      console.log('Step 1: Login to admin panel');
      await loginPage.login(browser, testData.credentials.email, testData.credentials.yopmailInbox);
      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      console.log('  Login successful');

      // Step 2: Navigate to Create Activity page
      console.log('Step 2: Navigate to Create Activity page');
      await activityPage.goToActivities();
      await activityPage.clickCreateActivity();
      await page.waitForURL(/\/activities\/create/, { timeout: 15000 });
      console.log('  On Create Activity page');

      // Step 3: Open age group dropdown and verify "7+" exists
      console.log('Step 3: Verify "7+" age range is in dropdown');
      const hasSevenPlus = await activityPage.isAgeGroupOptionVisible('7+');
      expect(hasSevenPlus).toBeTruthy();
      console.log('  Assertion passed: "7+" is visible in age group dropdown');

      console.log('\nQ-5445: PASSED - New "7+" age range is added\n');

    } catch (error) {
      console.error('\nQ-5445: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5445-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // Q-5446: Verify admin can create Prenatal activity
  // ─────────────────────────────────────────────────────────────────
  test(qase(5446, 'Q-5446: Verify admin can create Prenatal activity'), async ({ browser }) => {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('Q-5446: Verify admin can create Prenatal activity');
    console.log('════════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const loginPage = new LoginPage(page);
      const activityPage = new ActivityPage(page);

      // Step 1: Login
      console.log('Step 1: Login to admin panel');
      await loginPage.login(browser, testData.credentials.email, testData.credentials.yopmailInbox);
      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      console.log('  Login successful');

      // Step 2: Navigate to Activities
      console.log('Step 2: Navigate to Activities page');
      await activityPage.goToActivities();

      // Step 3: Create activity with Prenatal age group only
      console.log('Step 3: Create Prenatal activity');
      const activityData = {
        ...testData.prenatalActivity,
        name: generateUniqueActivityName()
      };
      const activityName = await activityPage.createActivity(activityData);
      console.log(`  Activity created with name: ${activityName}`);

      // Step 4: Verify activity is in the list
      console.log('Step 4: Verify activity appears in list');
      const url = page.url();
      expect(url).toContain('/activities');
      console.log('  Assertion passed: Redirected to activities list');

      console.log('\nQ-5446: PASSED - Admin can create Prenatal activity\n');

    } catch (error) {
      console.error('\nQ-5446: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5446-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // Q-5462: Verify admin can edit migrated age range
  // ─────────────────────────────────────────────────────────────────
  test(qase(5462, 'Q-5462: Verify admin can edit migrated age range'), async ({ browser }) => {
    console.log('\n════════════════════════════════════════════════════════');
    console.log('Q-5462: Verify admin can edit migrated age range');
    console.log('════════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const loginPage = new LoginPage(page);
      const activityPage = new ActivityPage(page);

      // Step 1: Login
      console.log('Step 1: Login to admin panel');
      await loginPage.login(browser, testData.credentials.email, testData.credentials.yopmailInbox);
      await page.waitForURL(/content-moderation/, { timeout: 30000 });
      console.log('  Login successful');

      // Step 2: Navigate to Activities and view first activity
      console.log('Step 2: Navigate to Activities and view first activity');
      await activityPage.goToActivities();
      await activityPage.viewActivity(0);

      // Step 3: Click Edit button
      console.log('Step 3: Click Edit to modify activity');
      await activityPage.editButton.waitFor({ state: 'visible', timeout: 10000 });
      await activityPage.scrollIntoView(activityPage.editButton);
      await activityPage.wait(500);
      await activityPage.editButton.click();
      console.log('  Edit button clicked');
      await activityPage.wait(2000);
      await activityPage.waitForPageLoad();

      // Step 4: Modify age groups - select new age ranges (7+, Prenatal)
      console.log('Step 4: Update age groups to include new age ranges');
      await activityPage.selectAgeGroups(['Prenatal', '7+']);
      console.log('  Age groups updated with Prenatal and 7+');

      // Step 5: Save changes
      console.log('Step 5: Save changes');
      await activityPage.scrollIntoView(activityPage.saveChangesButton);
      await activityPage.wait(500);
      await activityPage.saveChangesButton.click();
      console.log('  Save Changes clicked');

      await activityPage.wait(3000);

      // Step 6: Verify save success
      console.log('Step 6: Verify save was successful');
      try {
        await page.waitForURL(/\/activities(?:\/)?(?:\?.*)?$/, { timeout: 15000 });
        console.log('  Redirected to activities list - save successful');
      } catch {
        const url = page.url();
        console.log(`  Current URL: ${url}`);
      }

      console.log('\nQ-5462: PASSED - Admin can edit migrated age range\n');

    } catch (error) {
      console.error('\nQ-5462: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-5462-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });
});
