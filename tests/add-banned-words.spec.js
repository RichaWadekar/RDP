const { test, expect } = require('@playwright/test');
const { loginViaDemo } = require('./demoLoginHelper');

// ============================================================
// ADD YOUR WORDS HERE - one word per line
// ============================================================
const wordsToAdd = [
  'sand ni99er',
  'sand ni66er',
  'sand nigguh',
  'sand niggars',
  'sand niggurs',
  'sand n1ggers',
  'sand ni99ers',
  'sand nigga',
  'sand niggas',
  'sand niggr',
  'sand nigr',
  'sand nigs',
  'sand monkey',
  'sand monkeys',
  'desert nigger',
  'desert nigga',
];

test('Add Banned Words - Step 1 Only', async ({ browser }) => {
  test.setTimeout(300000);

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📌 ADD BANNED WORDS - STEP 1');
  console.log('═══════════════════════════════════════════════════════\n');

  // Check if words are provided
  if (wordsToAdd.length === 0) {
    console.log('⚠️  No words provided in wordsToAdd array. Please add words to the list.');
    return;
  }

  console.log(`📝 Words to add: ${wordsToAdd.join(', ')}\n`);

  // Create app context and page
  const appContext = await browser.newContext();
  const appPage = await appContext.newPage();

  try {
    // Login using demo-login pattern
    console.log('📍 Logging in...');
    await loginViaDemo(appPage, browser);
    console.log('  ✓ Login successful\n');

    // Navigate to Banned Words page
    console.log('📍 Navigating to Banned Words page...');
    await appPage.goto('https://stage.rainydayparents.com/banned-words', { waitUntil: 'networkidle' });
    await appPage.waitForTimeout(2000);

    // Verify page loads successfully
    const bannedWordsUrl = appPage.url();
    if (bannedWordsUrl.includes('banned-words')) {
      console.log('  ✓ Banned Words page loaded successfully\n');
    } else {
      throw new Error('Failed to navigate to Banned Words page');
    }

    // Wait for page to be ready
    await expect(appPage.getByRole('heading', { name: 'Banned Words Management' })).toBeVisible({ timeout: 15000 });

    // Get initial count
    console.log('📍 Getting initial Banned Words count...');
    const initialRows = appPage.locator('button[aria-label^="Edit"]');
    const initialCount = await initialRows.count();
    console.log(`  ✓ Initial count: ${initialCount} words\n`);

    // ============================================================
    // STEP 1: Add Banned Words (Loop through list)
    // ============================================================
    console.log('--- STEP 1: Adding Banned Words ---\n');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < wordsToAdd.length; i++) {
      const word = wordsToAdd[i];
      console.log(`\n📍 Adding word ${i + 1}/${wordsToAdd.length}: "${word}"`);

      try {
        // Click Add Banned Word button
        console.log('  → Clicking Add Banned Word button...');
        const addBannedWordBtn = appPage.locator('button').filter({ hasText: /Add Banned Word/i }).first();
        await expect(addBannedWordBtn).toBeVisible({ timeout: 10000 });
        await addBannedWordBtn.click();
        await appPage.waitForTimeout(1500);
        console.log('    ✓ Add button clicked');

        // Verify popup is opened
        console.log('  → Verifying popup is opened...');
        const addBannedWordPopup = appPage.locator('.modal-content, [class*="modal"], [role="dialog"]');
        await expect(addBannedWordPopup).toBeVisible({ timeout: 5000 });
        console.log('    ✓ Popup opened');

        // Fill Banned Word field
        console.log(`  → Entering word: "${word}"...`);
        const bannedWordInput = appPage.locator('input[placeholder="Enter the word..."]');
        await bannedWordInput.waitFor({ timeout: 5000 });
        await bannedWordInput.fill(word);
        await appPage.waitForTimeout(500);
        console.log('    ✓ Word entered');

        // Click Submit button
        console.log('  → Clicking Submit button...');
        const submitBannedWordBtn = appPage.locator('button').filter({ hasText: /^Submit$/i }).first();
        await expect(submitBannedWordBtn).toBeVisible({ timeout: 5000 });
        await submitBannedWordBtn.click();
        await appPage.waitForTimeout(2000);
        console.log('    ✓ Submit clicked');

        // Verify popup is closed
        await appPage.waitForTimeout(1000);
        const popupStillVisible = await addBannedWordPopup.isVisible().catch(() => false);
        if (!popupStillVisible) {
          console.log('    ✓ Popup closed');
        }

        // Check for success message
        const successMessage = appPage.locator('[class*="toast"], [class*="success"], [class*="alert"], [role="alert"]').filter({ hasText: /success|created|added|saved/i });
        const successVisible = await successMessage.count() > 0;
        if (successVisible) {
          const messageText = await successMessage.first().innerText().catch(() => '');
          console.log(`    ✓ Success: ${messageText}`);
        }

        console.log(`  ✅ Word "${word}" added successfully!`);
        successCount++;

        // Wait before next word
        await appPage.waitForTimeout(1000);

      } catch (error) {
        console.log(`  ❌ Failed to add "${word}": ${error.message}`);
        failCount++;

        // Try to close any open popup before continuing
        try {
          const closeBtn = appPage.locator('button').filter({ hasText: /Cancel|Close|×/i }).first();
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
            await appPage.waitForTimeout(500);
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    // Final count
    console.log('\n📍 Getting final Banned Words count...');
    await appPage.waitForTimeout(1000);
    const finalRows = appPage.locator('button[aria-label^="Edit"]');
    const finalCount = await finalRows.count();
    console.log(`  ✓ Final count: ${finalCount} words`);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`  Total words to add: ${wordsToAdd.length}`);
    console.log(`  Successfully added: ${successCount}`);
    console.log(`  Failed: ${failCount}`);
    console.log(`  Words before: ${initialCount}`);
    console.log(`  Words after: ${finalCount}`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (failCount === 0) {
      console.log('✅ ALL WORDS ADDED SUCCESSFULLY!\n');
    } else {
      console.log(`⚠️  ${failCount} word(s) failed to add.\n`);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    await appPage.screenshot({ path: 'add-banned-words-error.png', fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await appContext.close();
  }
});
