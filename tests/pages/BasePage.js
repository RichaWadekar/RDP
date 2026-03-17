/**
 * BasePage - Contains common methods used across all page objects
 */
class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.baseUrl = 'https://stage.rainydayparents.com';
  }

  /**
   * Navigate to a specific path
   * @param {string} path - URL path to navigate to
   */
  async navigate(path = '') {
    await this.page.goto(`${this.baseUrl}${path}`, { waitUntil: 'networkidle' });
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Wait for specified milliseconds
   * @param {number} ms - Milliseconds to wait
   */
  async wait(ms) {
    await this.page.waitForTimeout(ms);
  }

  /**
   * Get current page URL
   * @returns {string}
   */
  getUrl() {
    return this.page.url();
  }

  /**
   * Get page title
   * @returns {Promise<string>}
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Click an element
   * @param {import('@playwright/test').Locator} locator
   * @param {object} options
   */
  async click(locator, options = {}) {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.click(options);
  }

  /**
   * Fill an input field
   * @param {import('@playwright/test').Locator} locator
   * @param {string} text
   */
  async fill(locator, text) {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.fill(text);
  }

  /**
   * Clear and fill an input field
   * @param {import('@playwright/test').Locator} locator
   * @param {string} text
   */
  async clearAndFill(locator, text) {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    await locator.fill('');
    await locator.fill(text);
  }

  /**
   * Get text content of an element
   * @param {import('@playwright/test').Locator} locator
   * @returns {Promise<string>}
   */
  async getText(locator) {
    await locator.waitFor({ state: 'visible', timeout: 10000 });
    return await locator.textContent();
  }

  /**
   * Check if element is visible
   * @param {import('@playwright/test').Locator} locator
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async isVisible(locator, timeout = 5000) {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scroll element into view
   * @param {import('@playwright/test').Locator} locator
   */
  async scrollIntoView(locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop() {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  /**
   * Take screenshot
   * @param {string} name - Screenshot file name
   */
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `${name}.png`, fullPage: true });
  }

  /**
   * Press keyboard key
   * @param {string} key - Key to press
   */
  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  /**
   * Select option from dropdown
   * @param {string} labelText - Label text of the dropdown
   * @param {string} optionText - Option text to select
   */
  async selectDropdownOption(labelText, optionText) {
    const container = this.page.locator('div.space-y-2.relative').filter({
      has: this.page.locator(`label:has-text("${labelText}")`)
    });
    const dropdown = container.locator('div.form-input[role="button"]');

    await dropdown.scrollIntoViewIfNeeded();
    await this.wait(300);
    await dropdown.click();
    await this.wait(600);

    const option = this.page.locator('div.px-4.py-2.text-sm.cursor-pointer')
      .filter({ hasText: new RegExp(`^${optionText}$`) }).first();

    if (await this.isVisible(option, 3000)) {
      await option.click();
    } else {
      await this.page.getByText(optionText, { exact: true }).first().click();
    }

    await this.wait(500);
    await this.page.mouse.click(10, 10);
    await this.wait(300);
    await this.pressKey('Escape');
    await this.wait(300);
  }

  /**
   * Close any open overlays/dropdowns
   */
  async closeOpenOverlays() {
    try {
      await this.pressKey('Escape');
      await this.wait(80);
      await this.page.click('body', { position: { x: 1, y: 1 } }).catch(() => {});
      await this.wait(120);
      await this.page.evaluate(() => {
        const selectors = [
          '.dropdown-menu', '.react-select__menu', '[role="listbox"]',
          '.headlessui-listbox__options', '.menu', '.options',
          '.ui-popover', '.popover', '.rdp-layer'
        ];
        selectors.forEach(s => document.querySelectorAll(s).forEach(n => n.remove()));
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
      }).catch(() => {});
      await this.wait(120);
    } catch {
      // Ignore errors
    }
  }

  /**
   * Wait for success message
   * @param {number} timeout
   * @returns {Promise<boolean>}
   */
  async waitForSuccessMessage(timeout = 10000) {
    const successMessage = this.page.locator('text=/success|created|added|updated|saved|deleted|removed/i').first();
    return await this.isVisible(successMessage, timeout);
  }

  /**
   * Verify modal is closed
   * @param {import('@playwright/test').Locator} modal
   * @param {number} timeout
   */
  async verifyModalClosed(modal, timeout = 10000) {
    try {
      await modal.waitFor({ state: 'hidden', timeout });
      return true;
    } catch {
      await this.wait(2000);
      return false;
    }
  }
}

module.exports = { BasePage };
