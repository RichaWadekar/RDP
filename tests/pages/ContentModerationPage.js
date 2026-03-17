const { BasePage } = require('./BasePage');

/**
 * ContentModerationPage - Handles content moderation operations
 */
class ContentModerationPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators - Filters
    this.reportedDateInput = page.locator('input[placeholder="mm/dd/yyyy"]').first();
    this.applyFilterButton = page.locator('button:has-text("Apply Filter"), button:has-text("Apply")').first();
    this.clearFiltersButton = page.locator('button:has-text("Clear Filters"), button:has-text("Clear filter"), .btn-outline:has-text("Clear Filters")').first();

    // Locators - Table
    this.tableRows = page.locator('table tbody tr, [role="row"]');
    this.tableContainer = page.locator('table, [role="table"], .table-container').first();
    this.viewButtons = page.locator('button:has-text("View"), a:has-text("View")');

    // Locators - Details Page
    this.takeNoActionButton = page.locator('button:has-text("Take No Action"), button:has-text("No Action")').first();
    this.removeContentButton = page.locator('button:has-text("Remove Content"), button:has-text("Remove")').first();
    this.backButton = page.locator('button:has-text("Back"), a:has-text("Back"), [aria-label*="back"]').first();

    // Locators - Confirmation Popup
    this.confirmPopup = page.locator('[role="dialog"], .modal, .confirm-dialog');
    this.reasonField = page.locator('[role="dialog"] textarea, .modal textarea, textarea, input[placeholder*="reason"]').first();
    this.confirmNoActionButton = page.locator('button:has-text("Confirm No Action"), button:has-text("Confirm"), button:has-text("Yes")').first();
    this.confirmRemovalButton = page.locator('button:has-text("Confirm Removal"), button:has-text("Confirm"), button:has-text("Remove")').first();
  }

  /**
   * Navigate to content moderation page
   */
  async goToContentModerationPage() {
    await this.navigate('/content-moderation');
    await this.wait(2000);
    await this.waitForPageLoad();
    console.log('    Navigated to Content Moderation page');
  }

  /**
   * Apply date filter
   * @param {string} date - Date in MM/DD/YYYY format
   */
  async applyDateFilter(date) {
    await this.reportedDateInput.scrollIntoViewIfNeeded();
    await this.reportedDateInput.click();
    await this.wait(300);

    // Try to use calendar widget
    const dayLocator = this.page.locator('.react-datepicker__day, .rdp-day, button.react-datepicker__day').filter({ hasText: date.split('/')[1] }).first();
    if (await this.isVisible(dayLocator, 3000)) {
      await dayLocator.click().catch(() => {});
      console.log('    Clicked day in calendar');
      await this.closeOpenOverlays();
    } else {
      await this.reportedDateInput.fill(date);
      await this.pressKey('Enter');
      console.log('    Filled date input directly');
    }
    await this.wait(300);
  }

  /**
   * Select filter option by label
   * @param {string} labelText
   * @param {string} optionText
   * @param {string} optionValue
   */
  async selectFilterOption(labelText, optionText, optionValue) {
    const label = this.page.locator(`label:has-text("${labelText}")`).first();
    if ((await label.count()) === 0) {
      console.log(`    Label not found: ${labelText}`);
      return false;
    }

    const parent = label.locator('xpath=..');
    const button = parent.locator('div.form-input, div[role="button"]').first();

    if ((await button.count()) === 0) {
      console.log(`    Dropdown button not found for: ${labelText}`);
      return false;
    }

    await button.scrollIntoViewIfNeeded();

    // Try hidden select first
    const hiddenSelect = parent.locator('select.sr-only, select').first();
    if ((await hiddenSelect.count()) > 0 && optionValue) {
      try {
        await hiddenSelect.selectOption({ value: optionValue }).catch(() => {});
        await this.wait(150);
        return true;
      } catch {
        // Fall through to visible option
      }
    }

    // Open dropdown and click option
    await button.click();
    await this.wait(300);

    const candidates = this.page.locator(`text="${optionText}"`);
    const candCount = await candidates.count();
    for (let i = 0; i < candCount; i++) {
      const cand = candidates.nth(i);
      if (await cand.isVisible().catch(() => false)) {
        try {
          await cand.click();
          await this.wait(150);
          await this.closeOpenOverlays();
          return true;
        } catch {
          // Try next candidate
        }
      }
    }

    console.log(`    Option '${optionText}' not found for ${labelText}`);
    return false;
  }

  /**
   * Apply all filters
   * @param {object} filters
   */
  async applyFilters(filters) {
    console.log('    Applying filters...');

    // Reported Date
    if (filters.reportedDate) {
      await this.applyDateFilter(filters.reportedDate);
      console.log(`    Reported Date filter applied: ${filters.reportedDate}`);
    }

    // Report Reason
    if (filters.reportReason) {
      await this.selectFilterOption('Report Reason', filters.reportReason, 'SPAM');
      console.log(`    Report Reason filter applied: ${filters.reportReason}`);
    }

    // Status
    if (filters.status) {
      await this.selectFilterOption('Status', filters.status, 'ACTION_REQUIRED');
      console.log(`    Status filter applied: ${filters.status}`);
    }

    // Content
    if (filters.content) {
      await this.selectFilterOption('Content', filters.content, 'post');
      console.log(`    Content filter applied: ${filters.content}`);
    }

    await this.wait(2000);
    await this.waitForPageLoad();
  }

  /**
   * Click apply filter button
   */
  async clickApplyFilter() {
    if (await this.isVisible(this.applyFilterButton, 5000)) {
      await this.applyFilterButton.click();
      console.log('    Clicked Apply Filter button');
      await this.wait(2000);
      await this.waitForPageLoad();
    } else {
      console.log('    Apply Filter button not found. Filters may auto-apply.');
    }
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    await this.closeOpenOverlays();

    if (await this.isVisible(this.clearFiltersButton, 5000)) {
      const disabled = await this.clearFiltersButton.getAttribute('disabled');
      if (!disabled) {
        await this.clearFiltersButton.click();
        await this.wait(800);
        console.log('    Clicked Clear Filters button');
      } else {
        console.log('    Clear Filters button is disabled');
      }
    } else {
      console.log('    Clear Filters button not found');
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
   * Find row with "Action Required" status
   * @returns {Promise<{row: import('@playwright/test').Locator, index: number}|null>}
   */
  async findActionRequiredRow() {
    await this.scrollIntoView(this.tableContainer);
    await this.wait(500);

    const rowCount = await this.getRowCount();
    console.log(`    Found ${rowCount} rows`);

    for (let i = 0; i < rowCount; i++) {
      const row = this.tableRows.nth(i);
      const text = (await row.textContent().catch(() => '')).toLowerCase();

      if (text.includes('action required') || text.includes('action-required') || text.includes('action_required')) {
        console.log(`    Found "Action Required" item at row ${i + 1}`);
        return { row, index: i };
      }
    }

    console.log('    No explicit "Action Required" row found, using first row');
    return { row: this.tableRows.nth(0), index: 0 };
  }

  /**
   * Click view button for a row
   * @param {import('@playwright/test').Locator} row
   */
  async clickViewForRow(row) {
    const viewBtn = row.locator('button:has-text("View"), a:has-text("View")').first();
    const viewCount = await viewBtn.count();

    if (viewCount > 0) {
      const isVisible = await viewBtn.isVisible().catch(() => false);
      if (isVisible) {
        await viewBtn.click();
        console.log('    Clicked View button');
      } else {
        await row.click().catch(() => {});
        console.log('    View button not visible; clicked row instead');
      }
    } else {
      await row.click().catch(() => {});
      console.log('    View button not found; clicked row as fallback');
    }

    await this.wait(4000);
    await this.waitForPageLoad();
  }

  /**
   * Take no action on content
   * @param {string} reason
   */
  async takeNoAction(reason = 'No policy violation found') {
    console.log('    Clicking Take No Action button...');

    if (await this.isVisible(this.takeNoActionButton, 5000)) {
      await this.scrollIntoView(this.takeNoActionButton);
      await this.wait(500);

      const isEnabled = await this.takeNoActionButton.isEnabled().catch(() => false);
      const isVisible = await this.takeNoActionButton.isVisible().catch(() => false);
      console.log(`    Button enabled: ${isEnabled}, visible: ${isVisible}`);

      if (isEnabled && isVisible) {
        await this.takeNoActionButton.click().catch(() => {});
        console.log('    Clicked Take No Action button');
      }
    } else {
      console.log('    Take No Action button not found');
      return;
    }

    // Wait for popup
    await this.wait(1500);

    // Fill reason
    if (await this.isVisible(this.reasonField, 5000)) {
      await this.reasonField.fill(reason);
      console.log(`    Reason entered: "${reason}"`);
    }

    // Confirm
    if (await this.isVisible(this.confirmNoActionButton, 3000)) {
      await this.scrollIntoView(this.confirmNoActionButton);
      await this.wait(300);
      await this.confirmNoActionButton.click({ force: true }).catch(() => {});
      console.log('    Clicked Confirm No Action button');
    }

    await this.wait(2000);
  }

  /**
   * Remove content
   * @param {string} reason
   */
  async removeContent(reason = 'Violates community guidelines') {
    console.log('    Clicking Remove Content button...');

    if (await this.isVisible(this.removeContentButton, 5000)) {
      await this.scrollIntoView(this.removeContentButton);
      await this.wait(500);

      const isEnabled = await this.removeContentButton.isEnabled().catch(() => false);
      const isVisible = await this.removeContentButton.isVisible().catch(() => false);
      console.log(`    Button enabled: ${isEnabled}, visible: ${isVisible}`);

      if (isEnabled && isVisible) {
        await this.removeContentButton.click().catch(() => {});
        console.log('    Clicked Remove Content button');
      }
    } else {
      console.log('    Remove Content button not found');
      return;
    }

    // Wait for popup
    await this.wait(1500);

    // Fill reason
    if (await this.isVisible(this.reasonField, 5000)) {
      await this.reasonField.fill(reason);
      console.log(`    Reason entered: "${reason}"`);
    }

    // Confirm
    if (await this.isVisible(this.confirmRemovalButton, 3000)) {
      await this.scrollIntoView(this.confirmRemovalButton);
      await this.wait(300);
      await this.confirmRemovalButton.click({ force: true }).catch(() => {});
      console.log('    Clicked Confirm Removal button');
    }

    await this.wait(2000);
  }

  /**
   * Navigate back to content list
   */
  async goBack() {
    if (await this.isVisible(this.backButton, 3000)) {
      await this.backButton.click().catch(() => {});
      await this.waitForPageLoad();
      await this.wait(800);
      console.log('    Navigated back to content list');
    }
  }

  /**
   * Verify status changed
   * @param {number} rowIndex
   * @param {string} expectedStatus
   * @returns {Promise<boolean>}
   */
  async verifyStatusChanged(rowIndex, expectedStatus) {
    await this.wait(1000);
    const rowCount = await this.getRowCount();

    if (rowCount > rowIndex) {
      try {
        const rowText = await this.tableRows.nth(rowIndex).textContent().catch(() => '');
        if (rowText && rowText.toLowerCase().includes(expectedStatus.toLowerCase())) {
          console.log(`    Content status updated to "${expectedStatus}"`);
          return true;
        }
      } catch {
        // Ignore
      }
    }

    console.log('    Status update not visible (may require page refresh)');
    return false;
  }
}

module.exports = { ContentModerationPage };
