const { BasePage } = require('./BasePage');
const { generateUniqueFaqQuestion } = require('../utils/helpers');

/**
 * FAQPage - Handles FAQ management operations
 */
class FAQPage extends BasePage {
  constructor(page) {
    super(page);

    // Locators - List Page
    this.createFaqButton = page.getByRole('button', { name: /Create FAQ/i });
    this.faqListItems = page.locator('div[class*="faq"], li[class*="faq"], div[class*="item"]');
    this.pageHeader = page.getByRole('heading', { name: /FAQ|Frequently Asked/i });

    // Locators - Modal
    this.modal = page.locator('div.fixed.inset-0').first();
    this.questionInput = page.locator('input[placeholder="Enter your question..."]').first();
    this.answerInput = page.locator('textarea[placeholder="Enter your answer..."]').first();
    this.submitButton = this.modal.getByRole('button', { name: /Submit|Create|Save|Update/i }).first();
    this.updateButton = this.modal.getByRole('button', { name: /Update|Save|Submit/i }).first();
    this.deleteConfirmButton = this.modal.getByRole('button', { name: /Delete|Confirm/i }).first();
  }

  /**
   * Navigate to FAQ page
   */
  async goToFaqPage() {
    await this.navigate('/faqs');
    await this.wait(2000);
    await this.waitForPageLoad();
    console.log('    Navigated to FAQ page');
  }

  /**
   * Verify FAQ page is loaded
   */
  async verifyFaqPageLoaded() {
    try {
      await this.pageHeader.waitFor({ state: 'visible', timeout: 15000 });
      console.log('    FAQ page loaded successfully');
      return true;
    } catch {
      await this.waitForPageLoad();
      return false;
    }
  }

  /**
   * Click create FAQ button
   */
  async clickCreateFaq() {
    await this.createFaqButton.waitFor({ timeout: 10000 });
    console.log('    Create FAQ button found');
    await this.createFaqButton.click({ force: true });
    await this.wait(1000);
  }

  /**
   * Fill FAQ form
   * @param {string} question
   * @param {string} answer
   */
  async fillFaqForm(question, answer) {
    await this.questionInput.waitFor({ timeout: 5000 });
    await this.questionInput.fill(question);
    console.log(`    Question entered: "${question}"`);

    await this.answerInput.waitFor({ timeout: 5000 });
    await this.answerInput.fill(answer);
    console.log(`    Answer entered: "${answer}"`);
  }

  /**
   * Submit FAQ form
   */
  async submitFaqForm() {
    await this.submitButton.click({ force: true });
    console.log('    Submit button clicked');
    await this.wait(2000);
  }

  /**
   * Create new FAQ
   * @param {string} question
   * @param {string} answer
   * @returns {string} Question text
   */
  async createFaq(question = null, answer = 'working fine') {
    const faqQuestion = question || generateUniqueFaqQuestion();

    await this.clickCreateFaq();

    // Verify modal is open
    try {
      await this.modal.getByRole('heading', { name: /Create|New FAQ|Create FAQ/i }).waitFor({ state: 'visible', timeout: 10000 });
      console.log('    Create FAQ popup opened');
    } catch {
      await this.page.getByRole('heading', { name: /Create|New FAQ|Create FAQ/i }).waitFor({ state: 'visible', timeout: 10000 });
    }

    await this.fillFaqForm(faqQuestion, answer);
    await this.submitFaqForm();

    // Verify modal closed
    await this.verifyModalClosed(this.modal);
    console.log('    FAQ popup closed');

    // Verify success message
    await this.waitForSuccessMessage();
    console.log('    Success message displayed');

    await this.wait(2000);
    return faqQuestion;
  }

  /**
   * Find FAQ item by question text
   * @param {string} question
   * @returns {import('@playwright/test').Locator}
   */
  getFaqItem(question) {
    return this.faqListItems.filter({ hasText: question });
  }

  /**
   * Click edit button for a FAQ
   * @param {string} question
   */
  async clickEditFaq(question) {
    // Find edit button by pen icon
    const faqEditBtn = this.page.locator('button').filter({
      has: this.page.locator('svg.lucide-pen')
    }).filter({ hasText: question }).first();

    if (await faqEditBtn.count() > 0) {
      await faqEditBtn.click();
    } else {
      // Fallback: find by aria-label
      const allEditBtns = this.page.locator('button[aria-label*="Edit"]');
      const count = await allEditBtns.count();
      for (let i = 0; i < count; i++) {
        const label = await allEditBtns.nth(i).getAttribute('aria-label');
        if (label && label.includes(question.substring(0, 10))) {
          await allEditBtns.nth(i).click();
          break;
        }
      }
    }

    console.log('    Edit button clicked');
    await this.wait(1000);
  }

  /**
   * Edit existing FAQ
   * @param {string} originalQuestion
   * @param {string} newQuestion
   * @param {string} newAnswer
   * @returns {string} Updated question
   */
  async editFaq(originalQuestion, newQuestion = null, newAnswer = null) {
    await this.scrollToTop();
    await this.wait(1000);

    const updatedQuestion = newQuestion || originalQuestion + '?';
    const updatedAnswer = newAnswer || 'working fine!';

    await this.clickEditFaq(originalQuestion);

    // Verify edit modal is open
    try {
      await this.modal.getByRole('heading', { name: /Edit FAQ|Edit/i }).waitFor({ state: 'visible', timeout: 10000 });
      console.log('    Edit FAQ popup opened');
    } catch {
      await this.page.getByRole('heading', { name: /Edit FAQ|Edit/i }).waitFor({ state: 'visible', timeout: 10000 });
    }

    // Clear and update fields
    const editQuestionInput = this.page.locator('input[placeholder="Enter your question..."]');
    await editQuestionInput.waitFor({ timeout: 5000 });
    await editQuestionInput.fill('');
    await editQuestionInput.fill(updatedQuestion);
    console.log(`    Question updated: "${updatedQuestion}"`);

    const editAnswerInput = this.page.locator('textarea[placeholder="Enter your answer..."]');
    await editAnswerInput.waitFor({ timeout: 5000 });
    await editAnswerInput.fill('');
    await editAnswerInput.fill(updatedAnswer);
    console.log(`    Answer updated: "${updatedAnswer}"`);

    await this.wait(2000);

    // Click update button
    await this.updateButton.click({ force: true });
    console.log('    Update button clicked');
    await this.wait(500);

    // Verify modal closed
    await this.verifyModalClosed(this.modal);
    console.log('    Edit popup closed');

    // Verify success message
    await this.waitForSuccessMessage();
    console.log('    Update success message displayed');

    await this.wait(500);
    return updatedQuestion;
  }

  /**
   * Click delete button for a FAQ
   * @param {string} question
   */
  async clickDeleteFaq(question) {
    const faqDeleteBtn = this.page.locator('button').filter({
      has: this.page.locator('svg.lucide-trash2')
    }).filter({ hasText: question }).first();

    if (await faqDeleteBtn.count() > 0) {
      await faqDeleteBtn.click();
    } else {
      // Fallback: find by aria-label
      const allDeleteBtns = this.page.locator('button[aria-label*="Delete"]');
      const count = await allDeleteBtns.count();
      for (let i = 0; i < count; i++) {
        const label = await allDeleteBtns.nth(i).getAttribute('aria-label');
        if (label && label.includes(question.substring(0, 10))) {
          await allDeleteBtns.nth(i).click();
          break;
        }
      }
    }

    console.log('    Delete button clicked');
    await this.wait(1000);
  }

  /**
   * Delete FAQ
   * @param {string} question
   */
  async deleteFaq(question) {
    await this.clickDeleteFaq(question);

    // Verify delete confirmation popup
    try {
      await this.modal.getByRole('heading', { name: /Delete FAQ|Delete/i }).waitFor({ state: 'visible', timeout: 10000 });
      console.log('    Delete confirmation popup displayed');
    } catch {
      await this.modal.waitFor({ state: 'visible', timeout: 10000 });
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
   * Verify FAQ exists in list
   * @param {string} question
   * @returns {Promise<boolean>}
   */
  async verifyFaqExists(question) {
    await this.scrollToBottom();
    await this.wait(1500);
    const faqItem = this.getFaqItem(question);
    return await this.isVisible(faqItem.first(), 10000);
  }

  /**
   * Verify FAQ is removed from list
   * @param {string} question
   * @returns {Promise<boolean>}
   */
  async verifyFaqRemoved(question) {
    await this.wait(2000);
    const faqItem = this.getFaqItem(question);
    try {
      await faqItem.first().waitFor({ state: 'hidden', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { FAQPage };
