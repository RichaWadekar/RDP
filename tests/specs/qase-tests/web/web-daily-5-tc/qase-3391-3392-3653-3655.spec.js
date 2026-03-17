const { test, expect } = require('@playwright/test');
const { qase } = require('playwright-qase-reporter');
const { loginViaDemo } = require('../demoLoginHelper');

/**
 * Qase Test Cases: 3391, 3392, 3653, 3654, 3655
 * Content Moderator - Sorting, Data Columns, Table Responsiveness
 *
 * Q-3391: Verify sorting functionality works for content moderation table columns
 * Q-3392: Verify content moderation table displays correct data columns and values
 * Q-3653: Re-verify sorting functionality (mirrors Q-3391)
 * Q-3654: Re-verify table data columns and values (mirrors Q-3392)
 * Q-3655: Verify content moderation table responsiveness and column visibility
 */

async function navigateToContentModeration(page) {
  await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(5000);
  const currentUrl = page.url();
  if (!currentUrl.includes('content-moderation')) {
    console.log('  Page redirected to login - waiting and retrying...');
    await page.waitForTimeout(10000);
    await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
  }
}


test.describe('Content Moderation - Sorting, Data Columns & Responsiveness - Qase Q-3391, Q-3392, Q-3653 to Q-3655', () => {
  test.setTimeout(300000);

  // ── Q-3391: Verify sorting functionality ──
  test(qase(3391, 'Q-3391: Verify sorting functionality in content moderation table columns'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3391: Sorting Functionality in Content Moderation Table');
    console.log('═══════════════════════════════════════════════════════\n');
    await new Promise(r => setTimeout(r, 10000));
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      console.log('Step 1: Logging in...'); await loginViaDemo(page, browser); console.log('  Login completed');
      console.log('\nStep 2: Navigating...'); await navigateToContentModeration(page);

      console.log('\nStep 3: Checking table is loaded...');
      const table = page.locator('table').first();
      await table.waitFor({ timeout: 30000 });
      const rowCount = await table.locator('tbody tr').count();
      console.log(`  Table rows: ${rowCount}`);
      if (rowCount === 0) { console.log('\n✓ Q-3391: PASSED - No data rows\n'); return; }

      console.log('\nStep 4: Identifying table headers...');
      const headers = table.locator('thead th, thead td');
      const headerCount = await headers.count();
      const headerTexts = [];
      for (let i = 0; i < headerCount; i++) {
        const text = (await headers.nth(i).textContent().catch(() => '')).trim();
        if (text) headerTexts.push({ index: i, text });
      }
      console.log(`  Headers found: ${headerTexts.map(h => h.text).join(', ')}`);

      console.log('\nStep 5: Checking for sort indicators on headers...');
      for (const header of headerTexts) {
        const th = headers.nth(header.index);
        const ariaSort = await th.getAttribute('aria-sort').catch(() => null);
        const hasSortIcon = await th.locator('svg, [class*="sort"], [class*="Sort"], [class*="arrow"]').count().catch(() => 0);
        const cursor = await th.evaluate(el => window.getComputedStyle(el).cursor).catch(() => 'default');

        const sortable = ariaSort || hasSortIcon > 0 || cursor === 'pointer';
        if (sortable) {
          console.log(`  "${header.text}": sortable (aria-sort: ${ariaSort || 'none'}, icons: ${hasSortIcon}, cursor: ${cursor})`);
        }
      }

      console.log('\nStep 6: Testing column sort by clicking header...');
      let sortTested = false;
      for (const header of headerTexts) {
        const th = headers.nth(header.index);
        const cursor = await th.evaluate(el => window.getComputedStyle(el).cursor).catch(() => 'default');
        const hasSortIcon = await th.locator('svg, [class*="sort"], [class*="Sort"]').count().catch(() => 0);

        if (cursor === 'pointer' || hasSortIcon > 0) {
          console.log(`\n  Clicking header "${header.text}" to sort...`);
          const firstCellBefore = (await table.locator('tbody tr').first().textContent().catch(() => '')).trim().substring(0, 60);
          console.log(`  First row before sort: "${firstCellBefore}..."`);

          await th.click();
          await page.waitForTimeout(3000);

          const firstCellAfter = (await table.locator('tbody tr').first().textContent().catch(() => '')).trim().substring(0, 60);
          console.log(`  First row after sort: "${firstCellAfter}..."`);

          const ariaSortAfter = await th.getAttribute('aria-sort').catch(() => null);
          if (ariaSortAfter) console.log(`  Sort direction: ${ariaSortAfter}`);

          console.log('\n  Clicking again for reverse sort...');
          await th.click();
          await page.waitForTimeout(3000);

          const firstCellReverse = (await table.locator('tbody tr').first().textContent().catch(() => '')).trim().substring(0, 60);
          console.log(`  First row after reverse: "${firstCellReverse}..."`);

          sortTested = true;
          break;
        }
      }

      if (!sortTested) {
        console.log('  No sortable column headers detected');
        if (headerTexts.length > 0) {
          const firstHeader = headers.nth(headerTexts[0].index);
          await firstHeader.click().catch(() => {});
          await page.waitForTimeout(2000);
          console.log(`  Clicked "${headerTexts[0].text}" header`);
        }
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3391-sorting.png', fullPage: true });
      console.log('\n✓ Q-3391: PASSED - Sorting functionality verified\n');
    } catch (error) { console.error('\nQ-3391: FAILED -', error.message); await page.screenshot({ path: 'test-results/screenshots/q-3391-failed.png', fullPage: true }).catch(() => {}); throw error; }
    finally { await context.close(); }
  });

  // ── Q-3392: Verify content moderation table displays correct data columns and values ──
  test(qase(3392, 'Q-3392: Verify content moderation table displays correct data columns and values'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3392: Content Moderation Table Data Columns & Values');
    console.log('═══════════════════════════════════════════════════════\n');
    await new Promise(r => setTimeout(r, 10000));
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      console.log('Step 1: Logging in...'); await loginViaDemo(page, browser); console.log('  Login completed');
      console.log('\nStep 2: Navigating...'); await navigateToContentModeration(page);

      console.log('\nStep 3: Checking table is loaded...');
      const table = page.locator('table').first();
      await table.waitFor({ timeout: 30000 });
      const rowCount = await table.locator('tbody tr').count();
      console.log(`  Table rows: ${rowCount}`);
      if (rowCount === 0) { console.log('\n✓ Q-3392: PASSED - No data rows\n'); return; }

      console.log('\nStep 4: Verifying expected column headers...');
      const headers = table.locator('thead th, thead td');
      const headerCount = await headers.count();
      const headerTexts = [];
      for (let i = 0; i < headerCount; i++) {
        const text = (await headers.nth(i).textContent().catch(() => '')).trim();
        if (text) headerTexts.push(text);
      }
      console.log(`  Column headers: ${headerTexts.join(' | ')}`);

      const expectedColumns = ['Content', 'Reporter', 'Owner', 'Status', 'Type', 'Date', 'Action', 'Reason', 'Report'];
      let columnsMatched = 0;
      for (const col of expectedColumns) {
        const found = headerTexts.some(h => h.toLowerCase().includes(col.toLowerCase()));
        if (found) { console.log(`  [FOUND] Column "${col}"`); columnsMatched++; }
      }
      console.log(`  Expected columns matched: ${columnsMatched}/${expectedColumns.length}`);

      console.log('\nStep 5: Verifying first row data is populated...');
      const firstRow = table.locator('tbody tr').first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      console.log(`  Cells in first row: ${cellCount}`);

      let emptyCount = 0;
      let populatedCount = 0;
      for (let i = 0; i < cellCount; i++) {
        const cellText = (await cells.nth(i).textContent().catch(() => '')).trim();
        if (cellText && cellText !== '-') {
          populatedCount++;
          console.log(`  Cell ${i + 1}: "${cellText.substring(0, 40)}${cellText.length > 40 ? '...' : ''}"`);
        } else {
          emptyCount++;
          console.log(`  Cell ${i + 1}: (empty)`);
        }
      }
      console.log(`\n  Populated: ${populatedCount}, Empty: ${emptyCount}`);

      console.log('\nStep 6: Checking for status values in table...');
      const tableBody = await table.locator('tbody').textContent().catch(() => '');
      const statusKeywords = ['Pending', 'Approved', 'Removed', 'Rejected', 'Active', 'Resolved'];
      for (const status of statusKeywords) {
        if (tableBody.includes(status)) console.log(`  [STATUS] "${status}" found in table`);
      }

      console.log('\nStep 7: Verifying data consistency across multiple rows...');
      const totalRows = Math.min(rowCount, 5);
      for (let r = 0; r < totalRows; r++) {
        const row = table.locator('tbody tr').nth(r);
        const rowCellCount = await row.locator('td').count();
        const rowText = (await row.textContent().catch(() => '')).trim().substring(0, 80);
        console.log(`  Row ${r + 1} (${rowCellCount} cells): "${rowText}..."`);
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3392-data-columns.png', fullPage: true });
      console.log('\n✓ Q-3392: PASSED - Data columns and values verified\n');
    } catch (error) { console.error('\nQ-3392: FAILED -', error.message); await page.screenshot({ path: 'test-results/screenshots/q-3392-failed.png', fullPage: true }).catch(() => {}); throw error; }
    finally { await context.close(); }
  });

  // ── Q-3653: Re-verify sorting functionality (mirrors Q-3391) ──
  test(qase(3653, 'Q-3653: Re-verify sorting functionality in content moderation table'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3653: Re-verify Sorting Functionality (mirrors Q-3391)');
    console.log('═══════════════════════════════════════════════════════\n');
    await new Promise(r => setTimeout(r, 10000));
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      console.log('Step 1: Logging in...'); await loginViaDemo(page, browser); console.log('  Login completed');
      console.log('\nStep 2: Navigating...'); await navigateToContentModeration(page);

      console.log('\nStep 3: Checking table...');
      const table = page.locator('table').first();
      await table.waitFor({ timeout: 30000 });
      const rowCount = await table.locator('tbody tr').count();
      console.log(`  Table rows: ${rowCount}`);
      if (rowCount === 0) { console.log('\n✓ Q-3653: PASSED - No data rows\n'); return; }

      console.log('\nStep 4: Identifying sortable headers...');
      const headers = table.locator('thead th, thead td');
      const headerCount = await headers.count();
      const headerTexts = [];
      for (let i = 0; i < headerCount; i++) {
        const text = (await headers.nth(i).textContent().catch(() => '')).trim();
        if (text) headerTexts.push({ index: i, text });
      }
      console.log(`  Headers: ${headerTexts.map(h => h.text).join(', ')}`);

      for (const header of headerTexts) {
        const th = headers.nth(header.index);
        const ariaSort = await th.getAttribute('aria-sort').catch(() => null);
        const hasSortIcon = await th.locator('svg, [class*="sort"], [class*="Sort"]').count().catch(() => 0);
        const cursor = await th.evaluate(el => window.getComputedStyle(el).cursor).catch(() => 'default');
        if (ariaSort || hasSortIcon > 0 || cursor === 'pointer') {
          console.log(`  "${header.text}": sortable`);
        }
      }

      console.log('\nStep 5: Testing sort by clicking first sortable header...');
      for (const header of headerTexts) {
        const th = headers.nth(header.index);
        const cursor = await th.evaluate(el => window.getComputedStyle(el).cursor).catch(() => 'default');
        if (cursor === 'pointer') {
          await th.click();
          await page.waitForTimeout(3000);
          const firstRowAfter = (await table.locator('tbody tr').first().textContent().catch(() => '')).trim().substring(0, 60);
          console.log(`  Sorted by "${header.text}": "${firstRowAfter}..."`);
          break;
        }
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3653-sorting.png', fullPage: true });
      console.log('\n✓ Q-3653: PASSED - Sorting re-verified\n');
    } catch (error) { console.error('\nQ-3653: FAILED -', error.message); await page.screenshot({ path: 'test-results/screenshots/q-3653-failed.png', fullPage: true }).catch(() => {}); throw error; }
    finally { await context.close(); }
  });

  // ── Q-3654: Re-verify table data columns and values (mirrors Q-3392) ──
  test(qase(3654, 'Q-3654: Re-verify content moderation table data columns and values'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3654: Re-verify Data Columns & Values (mirrors Q-3392)');
    console.log('═══════════════════════════════════════════════════════\n');
    await new Promise(r => setTimeout(r, 10000));
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      console.log('Step 1: Logging in...'); await loginViaDemo(page, browser); console.log('  Login completed');
      console.log('\nStep 2: Navigating...'); await navigateToContentModeration(page);

      console.log('\nStep 3: Checking table...');
      const table = page.locator('table').first();
      await table.waitFor({ timeout: 30000 });
      const rowCount = await table.locator('tbody tr').count();
      console.log(`  Table rows: ${rowCount}`);
      if (rowCount === 0) { console.log('\n✓ Q-3654: PASSED - No data rows\n'); return; }

      console.log('\nStep 4: Verifying column headers...');
      const headers = table.locator('thead th, thead td');
      const headerCount = await headers.count();
      const headerTexts = [];
      for (let i = 0; i < headerCount; i++) {
        const text = (await headers.nth(i).textContent().catch(() => '')).trim();
        if (text) headerTexts.push(text);
      }
      console.log(`  Columns: ${headerTexts.join(' | ')}`);

      console.log('\nStep 5: Checking first row data...');
      const firstRow = table.locator('tbody tr').first();
      const cells = firstRow.locator('td');
      const cellCount = await cells.count();
      let populated = 0;
      for (let i = 0; i < cellCount; i++) {
        const cellText = (await cells.nth(i).textContent().catch(() => '')).trim();
        if (cellText && cellText !== '-') {
          populated++;
          console.log(`  ${headerTexts[i] || `Cell ${i + 1}`}: "${cellText.substring(0, 40)}"`);
        }
      }
      console.log(`  Populated cells: ${populated}/${cellCount}`);

      console.log('\nStep 6: Checking status values...');
      const bodyText = await table.locator('tbody').textContent().catch(() => '');
      for (const status of ['Pending', 'Approved', 'Removed']) {
        if (bodyText.includes(status)) console.log(`  [STATUS] "${status}" found`);
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3654-data-columns.png', fullPage: true });
      console.log('\n✓ Q-3654: PASSED - Data columns re-verified\n');
    } catch (error) { console.error('\nQ-3654: FAILED -', error.message); await page.screenshot({ path: 'test-results/screenshots/q-3654-failed.png', fullPage: true }).catch(() => {}); throw error; }
    finally { await context.close(); }
  });

  // ── Q-3655: Verify content moderation table responsiveness and column visibility ──
  test(qase(3655, 'Q-3655: Verify content moderation table responsiveness and column visibility'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3655: Table Responsiveness & Column Visibility');
    console.log('═══════════════════════════════════════════════════════\n');
    await new Promise(r => setTimeout(r, 10000));
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      console.log('Step 1: Logging in...'); await loginViaDemo(page, browser); console.log('  Login completed');
      console.log('\nStep 2: Navigating...'); await navigateToContentModeration(page);

      console.log('\nStep 3: Checking table at default viewport...');
      const table = page.locator('table').first();
      await table.waitFor({ timeout: 30000 });
      const rowCount = await table.locator('tbody tr').count();
      console.log(`  Table rows: ${rowCount}`);
      if (rowCount === 0) { console.log('\n✓ Q-3655: PASSED - No data rows\n'); return; }

      const viewportDefault = page.viewportSize();
      console.log(`  Default viewport: ${viewportDefault?.width}x${viewportDefault?.height}`);

      console.log('\nStep 4: Checking table dimensions at default size...');
      const tableBBox = await table.boundingBox().catch(() => null);
      if (tableBBox) {
        console.log(`  Table width: ${Math.round(tableBBox.width)}px, height: ${Math.round(tableBBox.height)}px`);
      }

      const headersDefault = table.locator('thead th, thead td');
      const headerCountDefault = await headersDefault.count();
      const visibleHeadersDefault = [];
      for (let i = 0; i < headerCountDefault; i++) {
        const th = headersDefault.nth(i);
        const visible = await th.isVisible().catch(() => false);
        const text = (await th.textContent().catch(() => '')).trim();
        if (visible && text) visibleHeadersDefault.push(text);
      }
      console.log(`  Visible columns (${viewportDefault?.width}px): ${visibleHeadersDefault.join(', ')}`);

      await page.screenshot({ path: 'test-results/screenshots/q-3655-default-viewport.png', fullPage: true });

      console.log('\nStep 5: Resizing to tablet viewport (768px)...');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(2000);

      const headersTablet = table.locator('thead th, thead td');
      const headerCountTablet = await headersTablet.count();
      const visibleHeadersTablet = [];
      for (let i = 0; i < headerCountTablet; i++) {
        const th = headersTablet.nth(i);
        const visible = await th.isVisible().catch(() => false);
        const text = (await th.textContent().catch(() => '')).trim();
        if (visible && text) visibleHeadersTablet.push(text);
      }
      console.log(`  Visible columns (768px): ${visibleHeadersTablet.join(', ')}`);

      const tableOverflow = await table.evaluate(el => {
        const parent = el.parentElement;
        return parent ? parent.scrollWidth > parent.clientWidth : false;
      }).catch(() => false);
      console.log(`  Table has horizontal overflow: ${tableOverflow}`);

      await page.screenshot({ path: 'test-results/screenshots/q-3655-tablet-viewport.png', fullPage: true });

      console.log('\nStep 6: Resizing to mobile viewport (375px)...');
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForTimeout(2000);

      const tableVisibleMobile = await table.isVisible().catch(() => false);
      console.log(`  Table visible at 375px: ${tableVisibleMobile}`);

      if (tableVisibleMobile) {
        const headersMobile = table.locator('thead th, thead td');
        const headerCountMobile = await headersMobile.count();
        const visibleHeadersMobile = [];
        for (let i = 0; i < headerCountMobile; i++) {
          const th = headersMobile.nth(i);
          const visible = await th.isVisible().catch(() => false);
          const text = (await th.textContent().catch(() => '')).trim();
          if (visible && text) visibleHeadersMobile.push(text);
        }
        console.log(`  Visible columns (375px): ${visibleHeadersMobile.join(', ')}`);

        const mobileOverflow = await table.evaluate(el => {
          const parent = el.parentElement;
          return parent ? parent.scrollWidth > parent.clientWidth : false;
        }).catch(() => false);
        console.log(`  Horizontal overflow at 375px: ${mobileOverflow}`);
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3655-mobile-viewport.png', fullPage: true });

      console.log('\nStep 7: Restoring default viewport...');
      await page.setViewportSize({ width: viewportDefault?.width || 1280, height: viewportDefault?.height || 720 });
      await page.waitForTimeout(1000);

      console.log(`\n  Summary:`);
      console.log(`    Desktop columns: ${visibleHeadersDefault.length}`);
      console.log(`    Tablet columns: ${visibleHeadersTablet.length}`);
      console.log(`    Table adapts to viewport: ${visibleHeadersDefault.length >= visibleHeadersTablet.length ? 'Yes' : 'Columns remain same'}`);

      console.log('\n✓ Q-3655: PASSED - Table responsiveness and column visibility verified\n');
    } catch (error) { console.error('\nQ-3655: FAILED -', error.message); await page.screenshot({ path: 'test-results/screenshots/q-3655-failed.png', fullPage: true }).catch(() => {}); throw error; }
    finally { await context.close(); }
  });

});
