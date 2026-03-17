const { BasePage } = require('./BasePage');

/**
 * UserModerationPage - Handles user moderation operations
 */
class UserModerationPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators - Filters
    this.searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"]').first();
    this.reportReasonDropdown = page.locator('label:has-text("Report Reason")').locator('..').locator('div.form-input, div[role="button"]').first();
    this.statusDropdown = page.locator('label:has-text("Status")').locator('..').locator('div.form-input, div[role="button"]').first();
    this.applyFilterButton = page.locator('button:has-text("Apply Filter"), button:has-text("Apply")').first();
    this.clearFiltersButton = page.locator('button:has-text("Clear Filters"), button:has-text("Clear Filter")').first();

    // Locators - Table
    this.tableRows = page.locator('table tbody tr, [role="row"]');
    this.viewButtons = page.locator('button:has-text("View"), a:has-text("View")');

    // Locators - User Details Page
    this.userDetailsHeader = page.locator('text=User Details, text=Reported User Details').first();
    this.issueWarningButton = page.locator('button:has-text("Issue Warning"), button:has-text("Warning")').first();
    this.banUserButton = page.locator('button:has-text("Ban User"), button:has-text("Ban")').first();
    this.ignoreReportButton = page.locator('button:has-text("Ignore Report"), button:has-text("Ignore")').first();
    this.backButton = page.locator('button:has-text("Back"), a:has-text("Back")').first();

    // Locators - Confirmation Popup
    this.confirmPopup = page.locator('[role="dialog"], .modal');
    this.reasonField = page.locator('[role="dialog"] textarea, .modal textarea, textarea').first();
    this.confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Submit")').first();
  }

  /**
   * Navigate to user moderation page
   */
  async goToUserModerationPage() {
    await this.navigate('/user-moderation');
    await this.wait(2000);
    await this.waitForPageLoad();
    console.log('    Navigated to User Moderation page');
  }

  /**
   * Enter search text
   * @param {string} searchText
   */
  async search(searchText) {
    if (await this.isVisible(this.searchInput, 5000)) {
      await this.searchInput.fill(searchText);
      console.log(`    Search text entered: ${searchText}`);
      await this.wait(1000);
    }
  }

  /**
   * Select report reason filter
   * @param {string} reason
   */
  async selectReportReason(reason) {
    await this.selectDropdownOption('Report Reason', reason);
    console.log(`    Report Reason selected: ${reason}`);
  }

  /**
   * Select status filter
   * @param {string} status
   */
  async selectStatus(status) {
    await this.selectDropdownOption('Status', status);
    console.log(`    Status selected: ${status}`);
  }

  /**
   * Apply filters
   * @param {object} filters
   */
  async applyFilters(filters) {
    if (filters.search) {
      await this.search(filters.search);
    }
    if (filters.reportReason) {
      await this.selectReportReason(filters.reportReason);
    }
    if (filters.status) {
      await this.selectStatus(filters.status);
    }

    // Click apply if button exists
    if (await this.isVisible(this.applyFilterButton, 3000)) {
      await this.applyFilterButton.click();
      console.log('    Apply Filter button clicked');
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
   * Find action required user
   * @returns {Promise<{row: import('@playwright/test').Locator, index: number}|null>}
   */
  async findActionRequiredUser() {
    const rowCount = await this.getRowCount();
    console.log(`    Found ${rowCount} users`);

    for (let i = 0; i < rowCount; i++) {
      const row = this.tableRows.nth(i);
      const text = (await row.textContent().catch(() => '')).toLowerCase();

      if (text.includes('action required')) {
        console.log(`    Found "Action Required" user at row ${i + 1}`);
        return { row, index: i };
      }
    }

    return null;
  }

  /**
   * Click view button for a row
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
   * Issue warning to user
   * @param {string} reason
   */
  async issueWarning(reason = 'Warning issued for policy violation') {
    if (await this.isVisible(this.issueWarningButton, 5000)) {
      await this.scrollIntoView(this.issueWarningButton);
      await this.issueWarningButton.click();
      console.log('    Issue Warning button clicked');

      await this.wait(1500);

      // Fill reason if popup appears
      if (await this.isVisible(this.reasonField, 3000)) {
        await this.reasonField.fill(reason);
        console.log(`    Reason entered: "${reason}"`);
      }

      // Confirm
      if (await this.isVisible(this.confirmButton, 3000)) {
        await this.confirmButton.click();
        console.log('    Confirmed warning');
      }

      await this.wait(2000);
    } else {
      console.log('    Issue Warning button not found');
    }
  }

  /**
   * Ban user
   * @param {string} reason
   */
  async banUser(reason = 'User banned for repeated violations') {
    if (await this.isVisible(this.banUserButton, 5000)) {
      await this.scrollIntoView(this.banUserButton);
      await this.banUserButton.click();
      console.log('    Ban User button clicked');

      await this.wait(1500);

      // Fill reason if popup appears
      if (await this.isVisible(this.reasonField, 3000)) {
        await this.reasonField.fill(reason);
        console.log(`    Reason entered: "${reason}"`);
      }

      // Confirm
      if (await this.isVisible(this.confirmButton, 3000)) {
        await this.confirmButton.click();
        console.log('    Confirmed ban');
      }

      await this.wait(2000);
    } else {
      console.log('    Ban User button not found');
    }
  }

  /**
   * Ignore report
   * @param {string} reason
   */
  async ignoreReport(reason = 'Report reviewed, no action needed') {
    if (await this.isVisible(this.ignoreReportButton, 5000)) {
      await this.scrollIntoView(this.ignoreReportButton);
      await this.ignoreReportButton.click();
      console.log('    Ignore Report button clicked');

      await this.wait(1500);

      // Fill reason if popup appears
      if (await this.isVisible(this.reasonField, 3000)) {
        await this.reasonField.fill(reason);
        console.log(`    Reason entered: "${reason}"`);
      }

      // Confirm
      if (await this.isVisible(this.confirmButton, 3000)) {
        await this.confirmButton.click();
        console.log('    Confirmed ignore');
      }

      await this.wait(2000);
    } else {
      console.log('    Ignore Report button not found');
    }
  }

  /**
   * Go back to list
   */
  async goBack() {
    if (await this.isVisible(this.backButton, 3000)) {
      await this.backButton.click();
      await this.waitForPageLoad();
      console.log('    Navigated back to user list');
    }
  }
}

module.exports = { UserModerationPage };
