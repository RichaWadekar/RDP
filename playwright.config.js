// playwright.config.js
// See https://playwright.dev/docs/test-configuration for more options

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  reporter: [['list'], ['html'], ['allure-playwright']],
  testDir: './tests',

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
