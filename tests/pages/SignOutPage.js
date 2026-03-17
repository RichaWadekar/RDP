const { BasePage } = require('./BasePage');

/**
 * SignOutPage - Handles sign out functionality
 */
class SignOutPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators
    this.dropdownArrow = page.locator('button[aria-label*="dropdown"], button:has(svg.lucide-chevron-down), .dropdown-toggle, button[aria-haspopup="true"]').first();
    this.userMenuButton = page.locator('button:has(svg), [class*="avatar"], [class*="user"]').first();
    this.signOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout"), a:has-text("Sign out"), a:has-text("Logout")').first();
    this.signOutDropdownItem = page.locator('[role="menuitem"]:has-text("Sign out"), [role="menuitem"]:has-text("Logout")').first();

    // Confirmation Popup
    this.confirmPopup = page.locator('[role="dialog"], .modal, [role="alertdialog"]');
    this.confirmSignOutButton = page.locator('button:has-text("Sign out"), button:has-text("Logout"), button:has-text("Confirm"), button:has-text("Yes")').first();
    this.cancelButton = page.locator('button:has-text("Cancel"), button:has-text("No")').first();
  }

  /**
   * Open user dropdown menu
   */
  async openDropdown() {
    // Try dropdown arrow first
    if (await this.isVisible(this.dropdownArrow, 3000)) {
      await this.dropdownArrow.click();
      console.log('    Dropdown arrow clicked');
    } else if (await this.isVisible(this.userMenuButton, 3000)) {
      await this.userMenuButton.click();
      console.log('    User menu button clicked');
    }

    await this.wait(500);
  }

  /**
   * Click sign out in dropdown
   */
  async clickSignOut() {
    // Try dropdown item first
    if (await this.isVisible(this.signOutDropdownItem, 3000)) {
      await this.signOutDropdownItem.click();
      console.log('    Sign out dropdown item clicked');
    } else if (await this.isVisible(this.signOutButton, 3000)) {
      await this.signOutButton.click();
      console.log('    Sign out button clicked');
    }

    await this.wait(1000);
  }

  /**
   * Confirm sign out in popup
   */
  async confirmSignOut() {
    // Check if confirmation popup appears
    if (await this.isVisible(this.confirmPopup, 5000)) {
      console.log('    Sign out confirmation popup opened');

      // Click confirm button
      if (await this.isVisible(this.confirmSignOutButton, 3000)) {
        await this.confirmSignOutButton.click();
        console.log('    Sign out confirmed');
      }
    }

    await this.wait(2000);
  }

  /**
   * Cancel sign out
   */
  async cancelSignOut() {
    if (await this.isVisible(this.cancelButton, 3000)) {
      await this.cancelButton.click();
      console.log('    Sign out cancelled');
      await this.wait(1000);
    }
  }

  /**
   * Complete sign out flow
   */
  async signOut() {
    console.log('    Starting sign out process...');

    // Step 1: Open dropdown
    await this.openDropdown();

    // Step 2: Click sign out
    await this.clickSignOut();

    // Step 3: Confirm if popup appears
    await this.confirmSignOut();

    // Step 4: Verify redirect to login page
    await this.waitForPageLoad();
  }

  /**
   * Verify user is logged out
   * @returns {Promise<boolean>}
   */
  async verifyLoggedOut() {
    const url = this.getUrl();
    const isOnLoginPage = url.includes('/login');

    if (isOnLoginPage) {
      console.log('    User successfully logged out - redirected to login page');
    }

    return isOnLoginPage;
  }

  /**
   * Verify sign out confirmation popup is displayed
   * @returns {Promise<boolean>}
   */
  async verifyConfirmPopupDisplayed() {
    return await this.isVisible(this.confirmPopup, 5000);
  }
}

module.exports = { SignOutPage };
