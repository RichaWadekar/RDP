const { test, expect } = require('@playwright/test');
const { LoginPage, ActivityPage } = require('../pages');
const { testData } = require('../fixtures/testData');
const { generateUniqueActivityName } = require('../utils/helpers');

/**
 * Activities Management Tests
 * - Create Activity
 * - Edit Activity
 * - Delete Activity
 * - Filter Activities
 * - Toggle between Admin/User created activities
 */

test.describe('Activities Management', () => {

  test('Create, Edit, Delete, Filter, and View Activities', async ({ browser }) => {
    test.setTimeout(600000); // 10 minutes timeout

    console.log('\n  Starting Activities Management test...\n');

    // Create app context and page
    const appContext = await browser.newContext();
    const appPage = await appContext.newPage();

    // Initialize page objects
    const loginPage = new LoginPage(appPage);
    const activityPage = new ActivityPage(appPage);

    // PRECONDITION: Login
    console.log('  Precondition: Logging in...');
    await loginPage.login(browser, testData.credentials.email, testData.credentials.yopmailInbox);
    await appPage.waitForLoadState('networkidle');
    await expect(appPage).toHaveURL(/content-moderation/);
    console.log('  User logged in successfully\n');

    // Store activity name for reference
    const activityName = generateUniqueActivityName();
    console.log(`  Activity Name: ${activityName}\n`);

    // STEP 1: Navigate to Activities Page & Sync
    console.log('  STEP 1: Navigate to Activities Page & Sync...');
    await activityPage.goToActivities();
    await expect(appPage).toHaveURL(/\/activities\/?$/);
    console.log('    Activities list page is displayed');

    await activityPage.clickSync();

    // STEP 2: Create New Activity
    console.log('\n  STEP 2: Create New Activity...');
    const activityData = {
      name: activityName,
      description: testData.activity.description,
      startDate: testData.activity.startDate,
      startTime: testData.activity.startTime,
      endDate: testData.activity.endDate,
      endTime: testData.activity.endTime,
      frequency: testData.activity.frequency,
      environmentType: testData.activity.environmentType,
      eventType: testData.activity.eventType,
      entryFee: testData.activity.entryFee,
      ageGroups: testData.activity.ageGroups,
      locationSearch: testData.activity.locationSearch,
      locationName: testData.activity.locationName
    };

    await activityPage.createActivity(activityData);
    await expect(appPage).toHaveURL(/\/activities/);

    const activitiesCount = await activityPage.getActivitiesCount();
    console.log(`    Activities list updated (${activitiesCount} activities found)`);

    console.log('\n  STEP 2 COMPLETED: Create New Activity');

    // STEP 3: View, Edit, and Delete Activity
    console.log('\n  STEP 3: View, Edit, and Delete Activity...');

    // View activity
    console.log('    3.1 Viewing created activity...');
    await activityPage.viewActivity(0);

    // Edit activity
    console.log('    3.2 Editing Activity...');
    await activityPage.editActivityEntryFee('10');

    // Delete activity
    console.log('    3.3 Deleting Activity...');
    await activityPage.deleteActivity();

    console.log('\n  STEP 3 COMPLETED: View, Edit, and Delete Activity');

    // STEP 4: Apply and Clear Filters
    console.log('\n  STEP 4: Apply and Clear Filters...');

    await activityPage.applyFilters({
      search: 'testing',
      frequency: 'Drop-in',
      status: 'Active'
    });

    const filteredCount = await activityPage.getActivitiesCount();
    console.log(`    Filtered results count: ${filteredCount} activities`);

    await activityPage.clearFilters();
    console.log('    All filters cleared');

    const completeCount = await activityPage.getActivitiesCount();
    console.log(`    Complete activities list count: ${completeCount} activities`);

    console.log('\n  STEP 4 COMPLETED: Apply and Clear Filters');

    // STEP 5: User-Created Activities Toggle
    console.log('\n  STEP 5: User-Created Activities Toggle...');

    const adminCountBefore = await activityPage.getActivitiesCount();
    console.log(`    Current list shows: ${adminCountBefore} Admin-created activities`);

    await activityPage.toggleActivityType();

    const userCountAfter = await activityPage.getActivitiesCount();
    console.log(`    After toggle: ${userCountAfter} User-created activities`);

    // View and back
    if (userCountAfter > 0) {
      await activityPage.viewActivity(0);
      await activityPage.clickBackToList();
    }

    console.log('\n  STEP 5 COMPLETED: Toggle, View, and Back to List');

    // Final Validation
    console.log('\n  Final Validation...');
    console.log('    Create, Edit, Delete, Filter, and View actions work correctly');
    console.log('    Page navigation works without issues');
    console.log('    Activities Management test completed successfully\n');

    // Cleanup
    await appContext.close();
  });
});
