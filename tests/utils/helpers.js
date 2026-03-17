/**
 * it provides helper functions
 * Utility helper functions for tests
 *  Reusable utility functions used across tests.
 */

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique string with timestamp
 * @param {string} prefix - Prefix for the unique string
 * @returns {string}
 */
function generateUniqueString(prefix = 'test') {
  return `${prefix}_${Date.now()}`;
}

/**
 * Generate unique email
 * @param {string} prefix - Email prefix
 * @returns {string}
 */
function generateUniqueEmail(prefix = 'test') {
  return `${prefix}+${Date.now()}@testmail.com`;
}

/**
 * Generate unique activity name
 * @returns {string}
 */
function generateUniqueActivityName() {
  return `Test Automation ${Date.now()}`;
}

/**
 * Generate unique FAQ question
 * @param {string} prefix
 * @returns {string}
 */
function generateUniqueFaqQuestion(prefix = 'test Faq') {
  return `${prefix}_${Date.now()}`;
}

/**
 * Format date as MM/DD/YYYY
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

/**
 * Get date offset from today
 * @param {number} days - Number of days to add (can be negative)
 * @returns {string} - Formatted date string
 */
function getDateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

module.exports = {
  sleep,
  generateUniqueString,
  generateUniqueEmail,
  generateUniqueActivityName,
  generateUniqueFaqQuestion,
  formatDate,
  getDateOffset
};
