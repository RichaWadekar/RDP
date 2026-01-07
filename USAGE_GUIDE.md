# Login Helper Usage Guide

## Overview
The shared login helper (`loginHelper.js` / `loginHelper.cjs`) handles the entire Yopmail OTP login flow. Once login completes, you have an authenticated page ready to run your feature automation.

---

## How to Use in Your Feature Tests

### For CommonJS Tests (using `require`)
```javascript
const { test, expect } = require('@playwright/test');
const loginWithYopmail = require('./loginHelper.cjs');

test('My Feature - with login', async ({ browser, context }) => {
  const email = 'admin.devrainyday@yopmail.com';
  const appUrl = 'https://dev.rainydayparents.com/login'; // or your env
  
  // Step 1: Perform login using helper
  const { appContext, appPage, emailContext, emailPage } = await loginWithYopmail(
    browser, 
    email, 
    appUrl,
    { context } // optional: pass existing context if you want to preserve storage
  );

  try {
    // Step 2: Run your feature automation (appPage is authenticated)
    await appPage.goto('https://dev.rainydayparents.com/activities');
    await appPage.click('button:has-text("Create Activity")');
    
    // ... your feature steps ...
    
  } finally {
    await appContext.close();
    await emailContext.close();
  }
});
```

### For ES Modules Tests (using `import`)
```javascript
import { test, expect } from '@playwright/test';
import { loginWithYopmail } from './loginHelper.js';

test('My Feature - with login', async ({ browser }) => {
  const email = 'admin.devrainyday@yopmail.com';
  
  // Step 1: Perform login
  const { appContext, appPage, emailContext } = await loginWithYopmail(browser, email);

  try {
    // Step 2: Run your feature automation
    await appPage.goto('https://dev.rainydayparents.com/activities');
    // ... feature steps ...
    
  } finally {
    await appContext.close();
    await emailContext.close();
  }
});
```

---

## Helper Function Signature

```javascript
loginWithYopmail(
  browser,                              // Playwright browser instance (required)
  email = 'admin.devrainyday@yopmail.com',  // Email to use for login
  appUrl = 'https://dev.rainydayparents.com/login',  // Login page URL
  options = {}                          // Optional: { context, appPage, emailContext }
)
```

### Returns
```javascript
{
  appContext,     // Browser context for the app (authenticated)
  appPage,        // Page where login succeeded (ready for feature automation)
  emailContext,   // Browser context used for Yopmail (close when done)
  emailPage       // Page for Yopmail (auto-created by helper)
}
```

---

## What the Helper Does
1. ✅ Navigates to the login page
2. ✅ Enters email and continues
3. ✅ Opens Yopmail in a separate context
4. ✅ Extracts OTP from email
5. ✅ Fills OTP in the login form
6. ✅ Submits and verifies login
7. ✅ Returns authenticated page + contexts

**You don't need to handle any of this—just call the helper and it works!**

---

## Example: New Feature Test (Copy & Modify)

```javascript
const { test, expect } = require('@playwright/test');
const loginWithYopmail = require('./loginHelper.cjs');

test('Create Event Feature - Login + Create', async ({ browser }) => {
  const email = 'admin.devrainyday@yopmail.com';
  let appContext, emailContext;

  try {
    // LOGIN
    const res = await loginWithYopmail(browser, email, 'https://dev.rainydayparents.com/login');
    appContext = res.appContext;
    emailContext = res.emailContext;
    const appPage = res.appPage;

    // FEATURE: Create an event
    await appPage.goto('https://dev.rainydayparents.com/events');
    await appPage.click('button:has-text("Create Event")');
    await appPage.fill('#event-name', 'My Event');
    await appPage.click('button:has-text("Save")');
    
    // VERIFY
    await expect(appPage).toHaveURL(/\/events\/\d+/);
    
  } finally {
    if (appContext) await appContext.close();
    if (emailContext) await emailContext.close();
  }
});
```

---

## Tips
- **Storage State**: If you want to reuse login (skip OTP next time), use Playwright's built-in `storageState` instead of calling helper every run.
- **Multiple Tests**: Each test calls the helper independently — no shared state between tests.
- **Custom Email**: Change the `email` parameter to use a different Yopmail account per test.
- **Custom URL**: Change `appUrl` to test different environments (dev, stage, prod).

---

## Cleanup
Always close both contexts in a `finally` block:
```javascript
finally {
  if (appContext) await appContext.close();
  if (emailContext) await emailContext.close();
}
```
