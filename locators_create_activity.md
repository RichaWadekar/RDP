# Admin Activities — Create Activity Locators

The following are suggested, defensive locators for the Admin "Create Activity" flow. Use the more specific selectors first (data-* / name / label), then fall back to text or CSS class selectors. Adjust if your app adds `data-testid` attributes; prefer those.

- **Activities page (entry URL):** `https://stage.rainydayparents.com/activities` or `/activities`

- **Create Activity button (primary):**
  - `button:has-text("Create Activity")`
  - fallback: `button:has-text("Create")`, `a:has-text("Create Activity")`
  - aria/test-id fallback: `button[aria-label="create activity"]`, `[data-testid="create-activity"]`

- **Activity Name (input)**
  - preferred: `input[name="name"]`, `input#name`
  - label-based (Playwright): `page.getByLabel('Activity Name')`
  - placeholder fallback: `input[placeholder*="Activity"]`
  - generic fallback: `input[type="text"]` (use only if specific selectors not present)

- **Description (textarea)**
  - preferred: `textarea[name="description"]`, `textarea#description`
  - label-based: `page.getByLabel('Description')`
  - placeholder fallback: `textarea[placeholder*="Description"]`

- **Age From / Age To (number inputs or selects)**
  - number inputs: `input[name="ageFrom"]`, `input[name="ageTo"]`, `input[type="number"]`
  - selects: `select[name="ageFrom"]`, `select[name="ageTo"]`
  - label-based: `page.getByLabel('Age From')`, `page.getByLabel('Age To')`

- **Location (autocomplete)**
  - input: `input[name="location"]`, `input[placeholder*="Location"]`, `input[aria-label*="Location"]`
  - autocomplete selection (after typing): wait for suggestion and choose first item: `div[role="option"] >> nth=0` or `.pac-item, .autocomplete-item, .MuiAutocomplete-option`
  - note: the app loads Google Places (observed in head); prefer typing the full label (e.g. "Baner, Pune") then `page.keyboard.press('ArrowDown')` + `page.keyboard.press('Enter')` to select

- **Start / End Date or Time (if present)**
  - date input: `input[placeholder="mm/dd/yyyy"]`, `.react-datepicker__day` (select by aria-label or visible text)

- **Create / Save / Submit button on form**
  - `button:has-text("Create")`, `button:has-text("Save")`, `button[type="submit"]`, `button:has-text("Submit")`
  - data/test-id: `[data-testid="activity-submit"]`

- **Success confirmation (toast / alert)**
  - `.toast`, `.MuiAlert-root`, `text=Activity created`, `text=Created successfully`

Notes and tips
- Prefer label-based locators (`page.getByLabel`) because they are robust to structural changes.
- If fields are not found, capture a screenshot and page HTML to inspect actual attribute names: `await page.screenshot({ path: 'debug.png', fullPage: true })` and `await fs.writeFileSync('page.html', await page.content())`.
- For Google Places autocomplete, wait for network idle after typing (or for the suggestions container to appear) before pressing ArrowDown/Enter.
- If the Create button is not visible, the page may require authentication — reuse `tests/firsttest.spec.js` login flow to produce an authenticated `storageState.json` and load it in the create test with `browser.newContext({ storageState: 'storageState.json' })`.

Example Playwright snippets (quick)

1) Click Create and fill name/description:

```js
await page.goto('/activities');
await page.click('button:has-text("Create Activity")');
await page.getByLabel('Activity Name').fill('football activity');
await page.getByLabel('Description').fill('football game for fun');
```

2) Fill age and location (autocomplete):

```js
await page.getByLabel('Age From').fill('1');
await page.getByLabel('Age To').fill('6');
await page.getByLabel('Location').fill('Baner, Pune');
await page.waitForTimeout(500);
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
```

3) Submit and verify:

```js
await page.click('button:has-text("Create")');
await page.waitForSelector('.toast, text=Activity created', { timeout: 5000 });
```

If you paste the exact outer HTML of the form (or a screenshot), I can convert the most specific attributes into selectors and update these locators to match the live markup precisely.
