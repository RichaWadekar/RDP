const fs = require('fs');
const path = require('path');

module.exports = async function globalSetup() {
  const screenshotDir = path.join('test-results', 'screenshots');
  fs.mkdirSync(screenshotDir, { recursive: true });
};
