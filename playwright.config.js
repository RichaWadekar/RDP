//** This is the brain of your Playwright project. It tells Playwright HOW to run tests.
//playwright.config.js
// See https://playwright.dev/docs/test-configuration for more options
require('dotenv').config();

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  globalSetup: './global-setup.js',
  reporter: [
    ['list'],
    ['html'],
    ['allure-playwright'],
    ['playwright-qase-reporter', {
      apiToken: process.env.QASE_API_TOKEN,
      projectCode: process.env.QASE_PROJECT_CODE,
      runComplete: true,
      basePath: 'https://api.qase.io/v1',
      logging: true,
      uploadAttachments: true,
    }]
  ],
  // POM Structure: tests are now in tests/specs folder
  testDir: './tests/specs',

  // Output folder for all test artifacts (screenshots, videos, traces)
  outputDir: './test-results',

  timeout: 120000,
  retries: process.env.CI ? 2 : 0,
  use: {
    headless: process.env.CI ? true : false,

    ignoreHTTPSErrors: true,

    // Video recording - 'on' records all tests, 'retain-on-failure' keeps only failed test videos
    video: 'on',

    // Trace recording - captures screenshots, DOM, network at each step
    // View trace: npx playwright show-trace trace.zip
    trace: 'on',

    // Screenshot on failure - captures full page screenshot when test fails
    screenshot: {
      mode: 'on',
      fullPage: true
    },
  },

  // Browser projects - Chrome runs by default, uncomment others when needed
  projects: [
    // DEFAULT: Chrome - always runs
    {
      name: 'Chrome',
      use: {
        browserName: 'chromium',
        channel: 'chrome',
      },
    },

    // OTHER BROWSERS - uncomment when needed for cross-browser testing
    // {
    //   name: 'Firefox',
    //   use: { browserName: 'firefox' },
    // },
    // {
    //   name: 'Safari',
    //   use: { browserName: 'webkit' },
    // },
    // {
    //   name: 'Edge',
    //   use: { browserName: 'chromium', channel: 'msedge' },
    // },

    // MOBILE - uncomment for mobile testing
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...require('@playwright/test').devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...require('@playwright/test').devices['iPhone 13'] },
    // },
  ],
};

module.exports = config;
