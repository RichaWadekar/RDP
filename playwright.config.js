// playwright.config.js
// See https://playwright.dev/docs/test-configuration for more options

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  reporter: [['list'], ['html'], ['allure-playwright']],
  testDir: './tests',
  timeout: 120000,
  retries: 0,
  use: {
    headless: false,
    //viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    trace: 'on',
    screenshot: 'only-on-failure',

  },
};

module.exports = config;
