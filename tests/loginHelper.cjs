// CommonJS wrapper that loads the ESM/CommonJS helper and exposes a Promise-returning function.
const path = require('path');

module.exports = async function loginWithYopmailWrapper(browser, email = 'admin.devrainyday@yopmail.com', appUrl = undefined, options = {}) {
  const helperPath = path.join(__dirname, 'loginHelper.js');
  // require the helper; it's CommonJS-exported in loginHelper.js
  const helper = require(helperPath);
  if (helper && typeof helper.loginWithYopmail === 'function') {
    return await helper.loginWithYopmail(browser, email, appUrl, options);
  }
  throw new Error('loginWithYopmail not found in helper');
};
