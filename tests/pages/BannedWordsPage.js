const { BasePage } = require('./BasePage');

/**
 * BannedWordsPage - Handles banned words management operations
 */
class BannedWordsPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators - List Page
    this.addBannedWordButton = page.locator('button:has-text("Add Banned Word"), button:has-text("Add Word"), button:has-text("Add")').first();
    this.searchInput = page.locator('input[placeholder*="Search banned words"], input[placeholder*="Search"]').first();
    this.clearSearchButton = page.locator('button[aria-label*="clear"], svg.lucide-x, button:has(svg.lucide-x)').first();
    this.bannedWordsList = page.locator('button[aria-label^="Edit"]');
    this.editButtons = page.locator('button[aria-label^="Edit"]');
    this.deleteButtons = page.locator('button[aria-label^="Delete"]');

    // Locators - Modal
    this.modal = page.locator('div.fixed.inset-0, [role="dialog"]').first();
    this.wordInput = page.locator('input[placeholder*="Enter"], input[placeholder*="word"], input[type="text"]').first();
    this.submitButton = this.modal.locator('button:has-text("Submit"), button:has-text("Add"), button:has-text("Save")').first();
    this.updateButton = this.modal.locator('button:has-text("Update"), button:has-text("Save")').first();
    this.deleteConfirmButton = this.modal.locator('button:has-text("Delete"), button:has-text("Confirm")').first();
  }

  /**
   * Navigate to banned words page
   */
  async goToBannedWordsPage() {
    await this.navigate('/banned-words');
    await this.wait(2000);
    await this.waitForPageLoad();
    console.log('    Navigated to Banned Words page');
  }

  /**
   * Get banned words count
   * @returns {Promise<number>}
   */
  async getBannedWordsCount() {
    return await this.editButtons.count();
  }

  /**
   * Click add banned word button
   */
  async clickAddBannedWord() {
    await this.addBannedWordButton.waitFor({ timeout: 10000 });
    await this.addBannedWordButton.click();
    console.log('    Add Banned Word button clicked');
    await this.wait(1000);
  }

  /**
   * Add new banned word
   * @param {string} word
   */
  async addBannedWord(word) {
    await this.clickAddBannedWord();

    // Verify modal is open
    await this.modal.waitFor({ state: 'visible', timeout: 10000 });
    console.log('    Add Banned Word popup opened');

    // Enter word
    await this.wordInput.waitFor({ timeout: 5000 });
    await this.wordInput.fill(word);
    console.log(`    Banned Word entered: "${word}"`);

    // Submit
    await this.submitButton.click();
    console.log('    Submit button clicked');

    await this.wait(2000);

    // Verify modal closed
    await this.verifyModalClosed(this.modal);
    console.log('    Add Banned Word popup closed');

    // Verify success message
    await this.waitForSuccessMessage();
    console.log('    Success message displayed');
  }

  /**
   * Edit banned word
   * @param {number} index - Index of word to edit (0-based)
   * @param {string} newWord - New word value
   */
  async editBannedWord(index = 0, newWord) {
    const editButton = this.editButtons.nth(index);

    if (await this.isVisible(editButton, 5000)) {
      await editButton.click();
      console.log('    Edit button clicked');

      await this.wait(1000);

      // Verify modal is open
      await this.modal.waitFor({ state: 'visible', timeout: 10000 });
      console.log('    Edit Banned Word popup opened');

      // Clear and enter new word
      const editInput = this.page.locator('input[placeholder*="Enter"], input[type="text"]').first();
      await editInput.waitFor({ timeout: 5000 });
      await editInput.fill('');
      await editInput.fill(newWord);
      console.log(`    Banned Word updated to: "${newWord}"`);

      // Update
      await this.updateButton.click();
      console.log('    Update button clicked');

      await this.wait(2000);

      // Verify success
      await this.waitForSuccessMessage();
      console.log('    Banned Word updated successfully');
    }
  }

  /**
   * Delete banned word
   * @param {number} index - Index of word to delete (0-based)
   */
  async deleteBannedWord(index = 0) {
    const deleteButton = this.deleteButtons.nth(index);

    if (await this.isVisible(deleteButton, 5000)) {
      await deleteButton.click();
      console.log('    Delete button clicked');

      await this.wait(1000);

      // Verify confirmation popup
      await this.modal.waitFor({ state: 'visible', timeout: 10000 });
      console.log('    Delete confirmation popup opened');

      // Confirm deletion
      await this.deleteConfirmButton.click();
      console.log('    Delete confirmed');

      await this.wait(2000);

      // Verify modal closed
      await this.verifyModalClosed(this.modal);
      console.log('    Delete confirmation popup closed');

      // Verify success message
      await this.waitForSuccessMessage();
      console.log('    Banned Word deleted successfully');
    }
  }

  /**
   * Search banned words
   * @param {string} searchText
   */
  async search(searchText) {
    if (await this.isVisible(this.searchInput, 5000)) {
      await this.searchInput.clear();
      await this.searchInput.fill(searchText);
      console.log(`    Search term entered: "${searchText}"`);
      await this.wait(1500);
    }
  }

  /**
   * Clear search
   */
  async clearSearch() {
    // Try clicking X button
    if (await this.isVisible(this.clearSearchButton, 3000)) {
      await this.clearSearchButton.click();
      console.log('    Search cleared via X button');
    } else {
      // Fallback: clear input directly
      await this.searchInput.clear();
      console.log('    Search input cleared');
    }

    await this.wait(1500);
  }

  /**
   * Verify banned word exists in list
   * @param {string} word
   * @returns {Promise<boolean>}
   */
  async verifyWordExists(word) {
    const wordElement = this.page.locator(`text="${word}"`).first();
    return await this.isVisible(wordElement, 5000);
  }
}

module.exports = { BannedWordsPage };
