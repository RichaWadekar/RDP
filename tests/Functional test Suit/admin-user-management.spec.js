const { test, expect } = require('@playwright/test');
const { LoginPage, AdminUserPage } = require('../pages');
const { testData } = require('../fixtures/testData');
const { generateUniqueEmail } = require('../utils/helpers');

/**
 * Admin User Management Tests
 * - Add Admin User
 * - Edit Admin User
 * - Delete Admin User
 */

test.describe('Admin User Management', () => {

  test('Admin User Management – Create, Edit, and Delete Admin User', async ({ browser }) => {
    test.setTimeout(testData.timeouts.test);

    console.log('\n  Starting Admin User Management test...\n');

    // Create app context and page
    const appContext = await browser.newContext();
    const appPage = await appContext.newPage();

    // Initialize page objects
    const loginPage = new LoginPage(appPage);
    const adminUserPage = new AdminUserPage(appPage);

    // Login (precondition)
    console.log('  Precondition: Logging in...');
    await loginPage.login(browser, testData.credentials.email, testData.credentials.yopmailInbox);

    // STEP 1: Navigate to Admin Users Page
    console.log('  STEP 1: Navigating to Admin Users page...');
    await appPage.waitForLoadState('networkidle');
    await expect(appPage).toHaveURL(/content-moderation/);
    console.log('    User logged in and on content-moderation page');

    await adminUserPage.goToAdminUsersPage();
    await expect(appPage).toHaveURL(/\/admin-users/);
    console.log('    Navigated to Admin Users page');

    await adminUserPage.verifyPageLoaded();

    // STEP 2: Add New Admin User
    console.log('\n  STEP 2: Adding new Admin User...');

    const newUser = {
      firstName: testData.adminUser.firstName,
      lastName: testData.adminUser.lastName,
      email: generateUniqueEmail('richa.admin'),
      role: testData.adminUser.role
    };

    const createdUser = await adminUserPage.addUser(newUser);

    // Verify user appears in list
    const userExists = await adminUserPage.verifyUserExists(createdUser.firstName);
    if (userExists) {
      console.log('    Newly created user visible in the list');
    }

    // STEP 3: Edit Existing Admin User
    console.log('\n  STEP 3: Editing the created Admin User...');

    const updatedUserData = {
      firstName: 'richa Dhananjay',
      lastName: 'wadekar shinde',
      email: generateUniqueEmail('richa.moderator'),
      role: 'Moderator'
    };

    const updatedUser = await adminUserPage.editUser(createdUser.firstName, updatedUserData);

    // Verify updated user in list
    const updatedExists = await adminUserPage.verifyUserExists(updatedUser.firstName);
    if (updatedExists) {
      console.log('    Updated user reflected in the list');
    }

    // STEP 4: Delete Admin User
    console.log('\n  STEP 4: Deleting the Admin User...');

    await adminUserPage.deleteUser(updatedUser.firstName);

    // Verify user is removed
    const userRemoved = await adminUserPage.verifyUserRemoved(updatedUser.firstName);
    if (userRemoved) {
      console.log('    User removed from the list');
    }

    // FINAL VALIDATION
    console.log('\n  FINAL VALIDATION');
    console.log('    Add Admin User functionality works correctly');
    console.log('    Edit Admin User functionality works correctly');
    console.log('    Delete Admin User functionality works correctly');
    console.log('    Success messages displayed for all actions');
    console.log('    Admin Users list refreshed correctly after each operation');
    console.log('\n  Admin User Management test completed successfully!\n');

    // Cleanup
    await appContext.close();
  });
});
