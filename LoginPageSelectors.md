# Login Page Selectors

Below are the selectors used by the Playwright test for the Rainyday admin login flow and Yopmail fetching.

- **Continue button (welcome & submit):** `page.getByRole('button', { name: 'Continue' })`
- **Email input (placeholder):** `page.getByPlaceholder('Enter your email')`
- **Email input (css fallback):** `input[placeholder="Enter your email"]`
- **OTP single-field fallback:** `input[name*="otp"], input.otp, input[id*="otp"]`
- **OTP single-char inputs:** `input[maxlength="1"], input[inputmode="numeric"], input[type="tel"]`
- **Yopmail inbox input:** `#login`
- **Yopmail inbox iframe (list):** `#ifinbox` (use `frameLocator('#ifinbox')`)
- **Yopmail mail iframe (message body):** `#ifmail` (use `frameLocator('#ifmail')`)

Notes:
- Yopmail uses the local-part of the address as the inbox identifier (i.e. `admin.devrainyday` for `admin.devrainyday@yopmail.com`).
- OTP extraction is performed by searching the email body for a 6-digit number; adjust the regex if the email wording changes.
**Rainyday Login Page Selectors**

- **Page URL**: `https://stage.rainydayparents.com/login`
- **Welcome Continue button**: `button:has-text("Continue")` (use `.first()`)
- **Email input**: `input[type="email"]` (fallback: `input[placeholder*="Email"]`, `input[name="email"]`)
- **Email Continue button**: `button:has-text("Continue")` (if multiple, use `.nth(1)` as in helper); fallback: nearest `form` button: `input[type="email"]` -> `ancestor::form` -> `form locator('button:visible').first()`
- **OTP input fields (per-digit)**: `input[maxlength="1"]` (count digits and fill nth inputs)
- **OTP single-field fallback**: `input[name="otp"], input[type="tel"], input[placeholder*="code"]`
- **Submit / final Continue**: `button:has-text("Continue")`, `button:has-text("Submit")` or keyboard `Enter`
- **Post-login verification**: look for dashboard/content-moderation URL change (check `page.url()`), or a success message selector (replace placeholder): `text=ENTER_ACTUAL_SUCCESS_MESSAGE_HERE`

**Yopmail (OTP retrieval) Selectors & strategies**

- **Direct inbox URL**: `https://yopmail.com/en/wm?login=<local-part>` (recommended to open directly)
- **Inbox input (homepage fallback)**: `input#login`, `input[name="login"]`
- **Check Inbox button**: `button[title*="Check Inbox"]`, `button:has-text("Check Inbox")`
- **Inbox list item candidates** (try in inbox frame): `div.ycptlistitem`, `.m2`, `.m`, `.listitem`, `a[href*="wm"]`, `li`
- **Mail body frame detection**: look for frames with URLs including `/mail`, `/ifmail`, or frames that don't include `/wm` (use `page.frames()` or Playwright `frameLocator('iframe#ifmail')`)
- **OTP extraction regex**: use a 6-digit capture (or 4-6 digits tolerant):

```
// preferred: 6-digit exact
/your verification code is[:\s]*?(\d{6})/i

// tolerant fallback
/\b(\d{4,6})\b/
```

**Playwright usage examples (short)**

- Find and click initial Continue:

```
const welcomeBtn = page.locator('button:has-text("Continue")').first();
await welcomeBtn.click();
```

- Fill email and click continue (robust):

```
const emailInput = page.locator('input[type="email"]');
await emailInput.fill('admin.devrainyday@yopmail.com');
const continueBtns = page.locator('button:has-text("Continue")');
await continueBtns.nth(1).click(); // or choose based on count
```

- Open Yopmail inbox and extract OTP (concept):

```
const inboxUrl = `https://yopmail.com/en/wm?login=${localPart}`;
const ypage = await browser.newPage();
await ypage.goto(inboxUrl);
// wait for frames, find mail frame, read body text
const mailFrame = ypage.frames().find(f => f.url().includes('/mail') || f.url().includes('/ifmail'));
const body = await mailFrame.textContent('body');
const m = body.match(/your verification code is[:\s]*?(\d{6})/i) || body.match(/\b(\d{4,6})\b/);
const otp = m && m[1];
```

**Notes & tips**

- The repository already uses the above selectors in `tests/commonLogin.js` (see `button:has-text("Continue")`, `input[type="email"]`, `input[maxlength="1"]`, and Yopmail fallbacks). Reuse those exact locators for stability.
- Replace `ENTER_ACTUAL_SUCCESS_MESSAGE_HERE` with the exact success text observed after OTP verification, or verify by URL change to the dashboard.
- If Yopmail is flaky, prefer the direct inbox URL (`/wm?login=`) to reduce manual input steps.

---

File created from audit of `tests/commonLogin.js` and the app's after-OTP markup.
