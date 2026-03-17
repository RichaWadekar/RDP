/**
 * Page Objects Index - Export all page objects from a single file
 */

const { BasePage } = require('./BasePage');
const { LoginPage } = require('./LoginPage');
const { ActivityPage } = require('./ActivityPage');
const { FAQPage } = require('./FAQPage');
const { AdminUserPage } = require('./AdminUserPage');
const { ContentModerationPage } = require('./ContentModerationPage');
const { UserModerationPage } = require('./UserModerationPage');
const { AppUserPage } = require('./AppUserPage');
const { BannedWordsPage } = require('./BannedWordsPage');
const { SignOutPage } = require('./SignOutPage');

module.exports = {
  BasePage,
  LoginPage,
  ActivityPage,
  FAQPage,
  AdminUserPage,
  ContentModerationPage,
  UserModerationPage,
  AppUserPage,
  BannedWordsPage,
  SignOutPage
};
