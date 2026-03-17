const { BasePage } = require('./BasePage');

/**
 * AppUserPage - Handles app user management operations
 */
class AppUserPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators - Filters
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    this.statusDropdown = page.locator('label:has-text("Status")').locator('..').locator('div.form-input, div[role="button"], select').first();
    this.joinedDateStartInput = page.locator('label:has-text("Joined Date")').first().locator('..').locator('input[placeholder="mm/dd/yyyy"]').first();
    this.joinedDateEndInput = page.locator('input[placeholder="mm/dd/yyyy"]').nth(1);
    this.clearFiltersButton = page.locator('button:has-text("Clear Filters")').first();

    // Locators - Table
    this.tableRows = page.locator('table tbody tr, [role="row"]');
    this.viewButtons = page.locator('button:has-text("View"), a:has-text("View")');
    this.unbanButtons = page.locator('button:has-text("Unban")');

    // Locators - User Details
    this.userDetailsHeader = page.locator('text=User Details, text=App User Details').first();
    this.backButton = page.locator('button:has-text("Back"), a:has-text("Back")').first();

    // Locators - Unban Confirmation
    this.confirmPopup = page.locator('[role="dialog"], .modal');
    this.confirmUnbanButton = page.locator('button:has-text("Confirm"), button:has-text("Unban"), button:has-text("Yes")').first();
  }

  /**
   * Navigate to app users page
   */
  async goToAppUsersPage() {
    await this.navigate('/app-users');
    await this.wait(2000);
    await this.waitForPageLoad();
    console.log('    Navigated to App Users page');
  }

  /**
   * Verify filter section is displayed
   * @returns {Promise<boolean>}
   */
  async verifyFilterSectionVisible() {
    const searchVisible = await this.isVisible(this.searchInput, 5000);
    const statusVisible = await this.isVisible(this.statusDropdown, 5000);
    return searchVisible && statusVisible;
  }

  /**
   * Enter search text
   * @param {string} searchText
   */
  async search(searchText) {
    if (await this.isVisible(this.searchInput, 5000)) {
      await this.searchInput.fill(searchText);
      console.log(`    Search text entered: ${searchText}`);
      await this.wait(1500);
    }
  }

  /**
   * Select status filter
   * @param {string} status - e.g., "Active", "Banned", "Warned"
   */
  async selectStatus(status) {
    await this.selectDropdownOption('Status', status);
    console.log(`    Status selected: ${status}`);
    await this.wait(1500);
  }

  /**
   * Set joined date range
   * @param {string} startDate
   * @param {string} endDate
   */
  async setJoinedDateRange(startDate, endDate) {
    if (startDate && await this.isVisible(this.joinedDateStartInput, 3000)) {
      await this.joinedDateStartInput.fill(startDate);
      console.log(`    Joined Date Start: ${startDate}`);
    }

    if (endDate && await this.isVisible(this.joinedDateEndInput, 3000)) {
      await this.joinedDateEndInput.fill(endDate);
      console.log(`    Joined Date End: ${endDate}`);
    }

    await this.wait(1000);
  }

  /**
   * Apply filters
   * @param {object} filters
   */
  async applyFilters(filters) {
    if (filters.search) {
      await this.search(filters.search);
    }
    if (filters.status) {
      await this.selectStatus(filters.status);
    }
    if (filters.startDate || filters.endDate) {
      await this.setJoinedDateRange(filters.startDate, filters.endDate);
    }

    await this.wait(2000);
    await this.waitForPageLoad();
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    if (await this.isVisible(this.clearFiltersButton, 5000)) {
      await this.clearFiltersButton.click();
      console.log('    Clear Filters button clicked');
      await this.wait(2000);
      await this.waitForPageLoad();
    }
  }

  /**
   * Get row count
   * @returns {Promise<number>}
   */
  async getRowCount() {
    return await this.tableRows.count();
  }

  /**
   * View user details
   * @param {number} index
   */
  async viewUser(index = 0) {
    const viewButton = this.viewButtons.nth(index);
    if (await this.isVisible(viewButton, 5000)) {
      await viewButton.click();
      console.log('    View button clicked');
      await this.wait(3000);
      await this.waitForPageLoad();
    }
  }

  /**
   * Find banned user in table
   * @returns {Promise<{row: import('@playwright/test').Locator, index: number}|null>}
   */
  async findBannedUser() {
    const rowCount = await this.getRowCount();

    for (let i = 0; i < rowCount; i++) {
      const row = this.tableRows.nth(i);
      const text = (await row.textContent().catch(() => '')).toLowerCase();

      if (text.includes('banned')) {
        console.log(`    Found banned user at row ${i + 1}`);
        return { row, index: i };
      }
    }

    console.log('    No banned users found');
    return null;
  }

  /**
   * Unban user
   * @param {number} index
   */
  async unbanUser(index = 0) {
    const unbanButton = this.unbanButtons.nth(index);

    if (await this.isVisible(unbanButton, 5000)) {
      await unbanButton.click();
      console.log('    Unban button clicked');

      await this.wait(1500);

      // Confirm unban
      if (await this.isVisible(this.confirmUnbanButton, 5000)) {
        await this.confirmUnbanButton.click();
        console.log('    Unban confirmed');
      }

      await this.wait(2000);
      await this.waitForPageLoad();
    } else {
      console.log('    No Unban button found');
    }
  }

  /**
   * Go back to list
   */
  async goBack() {
    if (await this.isVisible(this.backButton, 3000)) {
      await this.backButton.click();
      await this.waitForPageLoad();
      console.log('    Navigated back to app users list');
    }
  }

  /**
   * Verify filters are cleared
   * @returns {Promise<boolean>}
   */
  async verifyFiltersCleared() {
    const searchValue = await this.searchInput.inputValue().catch(() => '');
    return searchValue === '';
  }
}

module.exports = { AppUserPage };
