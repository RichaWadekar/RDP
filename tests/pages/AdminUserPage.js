const { BasePage } = require('./BasePage');
const { generateUniqueEmail } = require('../utils/helpers');

/**
 * AdminUserPage - Handles admin user management operations
 */
class AdminUserPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators - List Page
    this.addUserButton = page.getByRole('button', { name: /Add User|Add|New User|\+ Add/i });
    this.userListItems = page.locator('tr, div[class*="user"], div[class*="item"]');
    this.pageHeader = page.getByRole('heading', { name: /Admin Users|User Management|Users/i });

    // Locators - Modal
    this.modal = page.locator('div.fixed.inset-0').first();
    this.firstNameInput = page.locator('input[placeholder*="First"], input[placeholder*="first"], input[name*="first"]').first();
    this.lastNameInput = page.locator('input[placeholder*="Last"], input[placeholder*="last"], input[name*="last"]').first();
    this.emailInput = page.locator('input[placeholder*="Email"], input[placeholder*="email"], input[type="email"]').first();
    this.roleDropdown = page.locator('select').first().or(page.locator('button[role="combobox"]').first());
    this.sendInvitationButton = this.modal.getByRole('button', { name: /Send Invitation|Submit|Create|Add|Invite/i }).first();
    this.saveChangesButton = this.modal.getByRole('button', { name: /Save Changes|Update|Save|Submit/i }).first();
    this.deleteConfirmButton = this.modal.getByRole('button', { name: /Delete|Confirm|Yes/i }).first();
  }

  /**
   * Navigate to admin users page
   */
  async goToAdminUsersPage() {
    await this.navigate('/admin-users');
    await this.wait(2000);
    await this.waitForPageLoad();
    console.log('    Navigated to Admin Users page');
  }

  /**
   * Verify admin users page is loaded
   */
  async verifyPageLoaded() {
    try {
      await this.pageHeader.waitFor({ state: 'visible', timeout: 15000 });
      console.log('    Admin Users list loaded successfully');
      return true;
    } catch {
      await this.waitForPageLoad();
      return false;
    }
  }

  /**
   * Click add user button
   */
  async clickAddUser() {
    await this.addUserButton.waitFor({ timeout: 10000 });
    console.log('    Add User button found');
    await this.addUserButton.click({ force: true });
    await this.wait(1000);
  }

  /**
   * Fill user form
   * @param {string} firstName
   * @param {string} lastName
   * @param {string} email
   * @param {string} role
   */
  async fillUserForm(firstName, lastName, email, role) {
    await this.firstNameInput.waitFor({ timeout: 5000 });
    await this.firstNameInput.fill(firstName);
    console.log(`    First Name entered: "${firstName}"`);

    await this.lastNameInput.waitFor({ timeout: 5000 });
    await this.lastNameInput.fill(lastName);
    console.log(`    Last Name entered: "${lastName}"`);

    await this.emailInput.waitFor({ timeout: 5000 });
    await this.emailInput.fill(email);
    console.log(`    Email entered: "${email}"`);

    // Select role
    await this.selectRole(role);
    console.log(`    Role selected: "${role}"`);
  }

  /**
   * Select role from dropdown
   * @param {string} role
   */
  async selectRole(role) {
    await this.roleDropdown.waitFor({ timeout: 5000 });
    await this.roleDropdown.click({ force: true });
    await this.wait(500);

    const roleOption = this.page.locator(`text=/${role}/i`).filter({ hasText: role }).first();
    try {
      await roleOption.click({ force: true });
    } catch {
      const selectOptions = this.page.locator('option, [role="option"]');
      const count = await selectOptions.count();
      for (let i = 0; i < count; i++) {
        const text = await selectOptions.nth(i).textContent();
        if (text && text.includes(role)) {
          await selectOptions.nth(i).click({ force: true });
          break;
        }
      }
    }
    await this.wait(500);
  }

  /**
   * Add new admin user
   * @param {object} userData
   * @returns {object} User data with generated email
   */
  async addUser(userData = null) {
    const user = userData || {
      firstName: 'richa',
      lastName: 'wadekar',
      email: generateUniqueEmail('richa.admin'),
      role: 'Admin'
    };

    await this.clickAddUser();

    // Verify modal is open
    try {
      await this.modal.getByRole('heading', { name: /Add|New User|Create User|Add Admin/i }).waitFor({ state: 'visible', timeout: 10000 });
      console.log('    Add User popup opened');
    } catch {
      await this.page.getByRole('heading', { name: /Add|New User|Create User|Add Admin/i }).waitFor({ state: 'visible', timeout: 10000 });
    }

    await this.fillUserForm(user.firstName, user.lastName, user.email, user.role);

    // Click send invitation
    await this.sendInvitationButton.click({ force: true });
    console.log('    Send Invitation button clicked');
    await this.wait(2000);

    // Verify modal closed
    await this.verifyModalClosed(this.modal);
    console.log('    Add User popup closed');

    // Verify success message
    await this.waitForSuccessMessage();
    console.log('    Success message displayed');

    await this.wait(2000);
    return user;
  }

  /**
   * Find user item by name
   * @param {string} name
   * @returns {import('@playwright/test').Locator}
   */
  getUserItem(name) {
    return this.userListItems.filter({ hasText: name });
  }

  /**
   * Click edit button for a user
   * @param {string} firstName
   */
  async clickEditUser(firstName) {
    const userEditBtn = this.page.locator('button').filter({
      has: this.page.locator('svg.lucide-pen')
    }).filter({ hasText: firstName }).first();

    if (await userEditBtn.count() > 0) {
      await userEditBtn.click({ force: true });
    } else {
      const allEditBtns = this.page.locator('button[aria-label*="Edit"]');
      const count = await allEditBtns.count();
      for (let i = 0; i < count; i++) {
        const label = await allEditBtns.nth(i).getAttribute('aria-label');
        if (label && label.includes(firstName)) {
          await allEditBtns.nth(i).click({ force: true });
          break;
        }
      }
    }

    console.log('    Edit button clicked');
    await this.wait(1000);
  }

  /**
   * Edit existing user
   * @param {string} originalFirstName
   * @param {object} updatedData
   * @returns {object} Updated user data
   */
  async editUser(originalFirstName, updatedData = null) {
    await this.scrollToTop();
    await this.wait(1000);

    const updated = updatedData || {
      firstName: 'richa Dhananjay',
      lastName: 'wadekar shinde',
      email: generateUniqueEmail('richa.moderator'),
      role: 'Moderator'
    };

    await this.clickEditUser(originalFirstName);

    // Verify edit modal is open
    try {
      await this.modal.getByRole('heading', { name: /Edit User|Edit|Update User/i }).waitFor({ state: 'visible', timeout: 10000 });
      console.log('    Edit User popup opened');
    } catch {
      await this.page.getByRole('heading', { name: /Edit User|Edit|Update User/i }).waitFor({ state: 'visible', timeout: 10000 });
    }

    // Clear and update fields
    const editFirstNameInput = this.page.locator('input[placeholder*="First"], input[placeholder*="first"], input[name*="first"]');
    await editFirstNameInput.waitFor({ timeout: 5000 });
    await editFirstNameInput.fill('');
    await editFirstNameInput.fill(updated.firstName);
    console.log(`    First Name updated: "${updated.firstName}"`);

    const editLastNameInput = this.page.locator('input[placeholder*="Last"], input[placeholder*="last"], input[name*="last"]');
    await editLastNameInput.waitFor({ timeout: 5000 });
    await editLastNameInput.fill('');
    await editLastNameInput.fill(updated.lastName);
    console.log(`    Last Name updated: "${updated.lastName}"`);

    const editEmailInput = this.page.locator('input[placeholder*="Email"], input[placeholder*="email"], input[type="email"]');
    await editEmailInput.waitFor({ timeout: 5000 });
    await editEmailInput.fill('');
    await editEmailInput.fill(updated.email);
    console.log(`    Email updated: "${updated.email}"`);

    // Update role
    const editRoleDropdown = this.modal.locator('select').first().or(this.modal.locator('button[role="combobox"]').first());
    await editRoleDropdown.waitFor({ timeout: 5000 });
    await editRoleDropdown.click({ force: true });
    await this.wait(500);

    const roleOption = this.page.locator(`text=/${updated.role}/i`).filter({ hasText: updated.role }).first();
    await roleOption.click({ force: true }).catch(async () => {
      const selectOptions = this.page.locator('option, [role="option"]');
      const count = await selectOptions.count();
      for (let i = 0; i < count; i++) {
        const text = await selectOptions.nth(i).textContent();
        if (text && text.includes(updated.role)) {
          await selectOptions.nth(i).click({ force: true });
          break;
        }
      }
    });
    console.log(`    Role updated: "${updated.role}"`);
    await this.wait(500);

    await this.wait(2000);

    // Click save changes
    await this.saveChangesButton.click({ force: true });
    console.log('    Save Changes button clicked');
    await this.wait(500);

    // Verify modal closed
    await this.verifyModalClosed(this.modal);
    console.log('    Edit popup closed');

    // Verify success message
    await this.waitForSuccessMessage();
    console.log('    Update success message displayed');

    await this.wait(500);
    return updated;
  }

  /**
   * Click delete button for a user
   * @param {string} firstName
   */
  async clickDeleteUser(firstName) {
    const userDeleteBtn = this.page.locator('button').filter({
      has: this.page.locator('svg.lucide-trash2')
    }).filter({ hasText: firstName }).first();

    if (await userDeleteBtn.count() > 0) {
      await userDeleteBtn.click({ force: true });
    } else {
      const allDeleteBtns = this.page.locator('button[aria-label*="Delete"], button[aria-label*="delete"]');
      const count = await allDeleteBtns.count();
      for (let i = 0; i < count; i++) {
        const label = await allDeleteBtns.nth(i).getAttribute('aria-label');
        if (label && label.includes(firstName.substring(0, 10))) {
          await allDeleteBtns.nth(i).click({ force: true });
          break;
        }
      }
    }

    console.log('    Delete button clicked');
    await this.wait(1000);
  }

  /**
   * Delete user
   * @param {string} firstName
   */
  async deleteUser(firstName) {
    await this.scrollToTop();
    await this.wait(1000);

    await this.clickDeleteUser(firstName);

    // Verify delete confirmation popup
    try {
      await this.modal.getByRole('heading', { name: /Delete|Confirm|Are you sure/i }).waitFor({ state: 'visible', timeout: 10000 });
      console.log('    Delete confirmation popup displayed');
    } catch {
      await this.page.getByRole('heading', { name: /Delete|Confirm|Are you sure/i }).waitFor({ state: 'visible', timeout: 10000 });
    }

    // Confirm deletion
    await this.deleteConfirmButton.click({ force: true });
    console.log('    Confirmed deletion');
    await this.wait(2000);

    // Verify modal closed
    await this.verifyModalClosed(this.modal);
    console.log('    Delete confirmation popup closed');

    // Verify success message
    await this.waitForSuccessMessage();
    console.log('    Delete success message displayed');

    await this.wait(2000);
  }

  /**
   * Verify user exists in list
   * @param {string} name
   * @returns {Promise<boolean>}
   */
  async verifyUserExists(name) {
    await this.scrollToBottom();
    await this.wait(1500);
    const userItem = this.getUserItem(name);
    return await this.isVisible(userItem.first(), 10000);
  }

  /**
   * Verify user is removed from list
   * @param {string} name
   * @returns {Promise<boolean>}
   */
  async verifyUserRemoved(name) {
    await this.wait(2000);
    const userItem = this.getUserItem(name);
    try {
      await userItem.first().waitFor({ state: 'hidden', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { AdminUserPage };
