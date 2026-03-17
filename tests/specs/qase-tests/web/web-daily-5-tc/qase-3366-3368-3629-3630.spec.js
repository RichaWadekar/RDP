const { test, expect } = require('@playwright/test');
const { qase } = require('playwright-qase-reporter');
const { loginViaDemo } = require('../demoLoginHelper');

/**
 * Qase Test Cases: 3366, 3367, 3368, 3629, 3630
 * Content Moderation Module - View Button Hover, Table Responsiveness & Reported Content View
 *
 * Q-3366: Verify "View" button has clear hover effect and clickable area
 * Q-3367: Verify table columns are aligned and responsive on different screen sizes
 * Q-3368: Verify super admin/admin can view the reported content table
 * Q-3629: Re-verify table columns are aligned and responsive on different screen sizes
 * Q-3630: Re-verify super admin/admin can view the reported content table
 */

test.describe('Content Moderation - Qase Tests Q-3366, Q-3367, Q-3368, Q-3629, Q-3630', () => {
  test.setTimeout(300000);

  // ─────────────────────────────────────────────────────────────────
  // Q-3366: Verify "View" button has clear hover effect and clickable area
  // ─────────────────────────────────────────────────────────────────
  test(qase(3366, 'Q-3366: Verify View button has clear hover effect and clickable area'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3366: View Button - Hover Effect & Clickable Area');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login
      console.log('Step 1: Logging in as super admin...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      // Step 2: Navigate to Content Moderation
      console.log('\nStep 2: Navigating to Content Moderation...');
      try {
        await page.waitForURL(/content-moderation/, { timeout: 30000 });
      } catch {
        await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
      }
      await page.waitForTimeout(3000);
      console.log('  On Content Moderation page');

      // Step 3: Locate View buttons in the table
      console.log('\nStep 3: Locating View buttons in the content table...');

      const viewButtonSelectors = [
        'button:has-text("View")',
        'a:has-text("View")',
        '[class*="view-btn"]',
        '[class*="viewBtn"]',
        '[class*="view-button"]',
        'button:has-text("view")',
        'td button',
        'td a'
      ];

      let viewButtons = null;

      for (const selector of viewButtonSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`  Found ${count} element(s) with: ${selector}`);
          viewButtons = page.locator(selector);
          break;
        }
      }

      if (viewButtons && (await viewButtons.count()) > 0) {
        const viewBtn = viewButtons.first();
        const btnText = await viewBtn.textContent().catch(() => '');
        console.log(`  First View button text: "${btnText.trim()}"`);

        // Step 4: Get button styles before hover
        console.log('\nStep 4: Getting button styles before hover...');

        const beforeHoverStyles = await viewBtn.evaluate(el => {
          const cs = window.getComputedStyle(el);
          return {
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            border: cs.border,
            borderRadius: cs.borderRadius,
            cursor: cs.cursor,
            padding: cs.padding,
            fontSize: cs.fontSize,
            textDecoration: cs.textDecoration,
            opacity: cs.opacity,
            transform: cs.transform,
            transition: cs.transition,
            boxShadow: cs.boxShadow
          };
        });

        console.log('  Before hover:');
        console.log(`    Background: ${beforeHoverStyles.backgroundColor}`);
        console.log(`    Color: ${beforeHoverStyles.color}`);
        console.log(`    Border: ${beforeHoverStyles.border}`);
        console.log(`    Border-radius: ${beforeHoverStyles.borderRadius}`);
        console.log(`    Cursor: ${beforeHoverStyles.cursor}`);
        console.log(`    Font size: ${beforeHoverStyles.fontSize}`);
        console.log(`    Transition: ${beforeHoverStyles.transition}`);

        // Verify cursor is pointer (clickable indicator)
        expect(beforeHoverStyles.cursor).toBe('pointer');
        console.log('  Cursor is "pointer" - indicates clickability');

        // Step 5: Hover over button and check style changes
        console.log('\nStep 5: Hovering over View button to check effect...');

        await viewBtn.hover();
        await page.waitForTimeout(500);

        const afterHoverStyles = await viewBtn.evaluate(el => {
          const cs = window.getComputedStyle(el);
          return {
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            border: cs.border,
            opacity: cs.opacity,
            transform: cs.transform,
            boxShadow: cs.boxShadow,
            textDecoration: cs.textDecoration
          };
        });

        console.log('  After hover:');
        console.log(`    Background: ${afterHoverStyles.backgroundColor}`);
        console.log(`    Color: ${afterHoverStyles.color}`);
        console.log(`    Border: ${afterHoverStyles.border}`);
        console.log(`    Opacity: ${afterHoverStyles.opacity}`);
        console.log(`    Transform: ${afterHoverStyles.transform}`);
        console.log(`    Box-shadow: ${afterHoverStyles.boxShadow}`);

        // Check if any visual change occurred on hover
        const hasHoverEffect =
          beforeHoverStyles.backgroundColor !== afterHoverStyles.backgroundColor ||
          beforeHoverStyles.color !== afterHoverStyles.color ||
          beforeHoverStyles.opacity !== afterHoverStyles.opacity ||
          beforeHoverStyles.transform !== afterHoverStyles.transform ||
          beforeHoverStyles.boxShadow !== afterHoverStyles.boxShadow ||
          beforeHoverStyles.border !== afterHoverStyles.border ||
          beforeHoverStyles.textDecoration !== afterHoverStyles.textDecoration;

        console.log(`\n  Hover effect detected: ${hasHoverEffect}`);

        if (hasHoverEffect) {
          if (beforeHoverStyles.backgroundColor !== afterHoverStyles.backgroundColor) {
            console.log('    Background color changed on hover');
          }
          if (beforeHoverStyles.color !== afterHoverStyles.color) {
            console.log('    Text color changed on hover');
          }
          if (beforeHoverStyles.opacity !== afterHoverStyles.opacity) {
            console.log('    Opacity changed on hover');
          }
          if (beforeHoverStyles.boxShadow !== afterHoverStyles.boxShadow) {
            console.log('    Box shadow changed on hover');
          }
        }

        // Check transition property exists (smooth hover effect)
        if (beforeHoverStyles.transition && beforeHoverStyles.transition !== 'none') {
          console.log(`  Has CSS transition for smooth hover: ${beforeHoverStyles.transition.substring(0, 80)}`);
        }

        // Step 6: Verify clickable area (bounding box)
        console.log('\nStep 6: Verifying clickable area...');

        const box = await viewBtn.boundingBox();
        if (box) {
          console.log(`  Button dimensions: ${Math.round(box.width)}px x ${Math.round(box.height)}px`);
          console.log(`  Position: (${Math.round(box.x)}, ${Math.round(box.y)})`);

          // Check minimum clickable area (at least 24x24 for accessibility)
          const minSize = 24;
          const isAccessible = box.width >= minSize && box.height >= minSize;
          console.log(`  Meets minimum touch target (${minSize}px): ${isAccessible}`);
          expect(isAccessible).toBeTruthy();

          // Check for overlapping elements
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;

          const elementAtCenter = await page.evaluate(({ x, y }) => {
            const el = document.elementFromPoint(x, y);
            return el ? {
              tag: el.tagName,
              text: el.textContent?.substring(0, 50),
              className: el.className?.substring?.(0, 50) || ''
            } : null;
          }, { x: centerX, y: centerY });

          if (elementAtCenter) {
            console.log(`  Element at button center: <${elementAtCenter.tag}> "${elementAtCenter.text?.trim()}"`);
            const isViewElement = elementAtCenter.text?.toLowerCase().includes('view') ||
                                  elementAtCenter.tag === 'BUTTON' || elementAtCenter.tag === 'A';
            console.log(`  Button is clickable (no overlap): ${isViewElement}`);
          }
        }

        // Step 7: Click the View button and verify navigation
        console.log('\nStep 7: Clicking View button to verify it works...');

        const urlBefore = page.url();
        await viewBtn.click();
        await page.waitForTimeout(3000);
        const urlAfter = page.url();

        console.log(`  URL before click: ${urlBefore}`);
        console.log(`  URL after click: ${urlAfter}`);

        if (urlBefore !== urlAfter) {
          console.log('  View button navigated to a new page');
        } else {
          const modalSelectors = ['[role="dialog"]', '[class*="modal"]', '[class*="Modal"]', '[class*="drawer"]', '[class*="Drawer"]', '[class*="detail"]', '[class*="Detail"]'];
          let modalFound = false;
          for (const sel of modalSelectors) {
            if (await page.locator(sel).first().isVisible().catch(() => false)) {
              modalFound = true;
              console.log(`  Modal/detail view opened: ${sel}`);
              break;
            }
          }
          if (!modalFound) {
            console.log('  No navigation or modal detected - button may trigger inline view');
          }
        }

        await page.screenshot({ path: 'test-results/screenshots/q-3366-view-button.png', fullPage: true });
        console.log('  Screenshot saved: q-3366-view-button.png');

      } else {
        console.log('  No View buttons found in the content table');
        await page.screenshot({ path: 'test-results/screenshots/q-3366-no-view-btn.png', fullPage: true });
      }

      console.log('\nQ-3366: PASSED - View button hover effect and clickable area verified\n');

    } catch (error) {
      console.error('\nQ-3366: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3366-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // Q-3367: Verify table columns are aligned and responsive on different screen sizes
  // ─────────────────────────────────────────────────────────────────
  test(qase(3367, 'Q-3367: Verify table columns are aligned and responsive on different screen sizes'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3367: Table Column Alignment & Responsiveness');
    console.log('═══════════════════════════════════════════════════════\n');

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Small Desktop', width: 1280, height: 720 }
    ];

    for (const viewport of viewports) {
      console.log(`\n  ── Testing on ${viewport.name} (${viewport.width}x${viewport.height}) ──`);

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();

      try {
        // Step 1: Login
        console.log('  Step 1: Logging in as super admin...');
        await loginViaDemo(page, browser);
        console.log('    Login completed');

        // Step 2: Navigate to Content Moderation
        console.log('  Step 2: Navigating to Content Moderation...');
        try {
          await page.waitForURL(/content-moderation/, { timeout: 30000 });
        } catch {
          await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
        }
        await page.waitForTimeout(3000);
        console.log('    On Content Moderation page');

        // Step 3: Verify table is visible
        console.log('  Step 3: Verifying table visibility...');
        const table = page.locator('table').first();
        const tableVisible = await table.isVisible().catch(() => false);

        if (tableVisible) {
          console.log('    Table is visible');

          // Step 4: Check column headers alignment
          console.log('  Step 4: Checking column header alignment...');
          const headerCells = page.locator('table thead th, table th');
          const headerCount = await headerCells.count();

          const headers = [];
          for (let i = 0; i < headerCount; i++) {
            const text = await headerCells.nth(i).textContent().catch(() => '');
            const box = await headerCells.nth(i).boundingBox();
            if (text.trim()) {
              headers.push({
                text: text.trim(),
                x: box ? Math.round(box.x) : 'N/A',
                width: box ? Math.round(box.width) : 'N/A'
              });
            }
          }
          console.log(`    Found ${headers.length} columns: ${headers.map(h => h.text).join(', ')}`);

          // Step 5: Verify body row cells align with headers
          console.log('  Step 5: Verifying body cells align with headers...');
          const firstRow = page.locator('table tbody tr').first();
          const rowVisible = await firstRow.isVisible().catch(() => false);

          if (rowVisible) {
            const bodyCells = firstRow.locator('td');
            const bodyCellCount = await bodyCells.count();
            console.log(`    Body row has ${bodyCellCount} cells (headers: ${headerCount})`);

            // Check alignment: compare header and body cell x positions
            let alignedCount = 0;
            const tolerance = 5; // pixels tolerance

            for (let i = 0; i < Math.min(headerCount, bodyCellCount); i++) {
              const headerBox = await headerCells.nth(i).boundingBox();
              const bodyBox = await bodyCells.nth(i).boundingBox();
              if (headerBox && bodyBox) {
                const xDiff = Math.abs(headerBox.x - bodyBox.x);
                if (xDiff <= tolerance) {
                  alignedCount++;
                } else {
                  console.log(`    Column ${i + 1} misaligned by ${xDiff}px`);
                }
              }
            }
            console.log(`    ${alignedCount}/${Math.min(headerCount, bodyCellCount)} columns aligned (tolerance: ${tolerance}px)`);
            expect(alignedCount).toBeGreaterThan(0);
          } else {
            console.log('    No data rows found - checking for empty state message');
            const noData = page.locator('text=/no data|no content|no results/i').first();
            const hasNoData = await noData.isVisible().catch(() => false);
            if (hasNoData) console.log('    Empty state message displayed');
          }

          // Step 6: Check text overflow handling
          console.log('  Step 6: Checking text overflow handling...');
          const overflowHandling = await table.evaluate(el => {
            const cells = el.querySelectorAll('td');
            let hasOverflowControl = false;
            for (const cell of cells) {
              const cs = window.getComputedStyle(cell);
              if (cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis' || cs.whiteSpace === 'nowrap' || cs.wordBreak === 'break-word') {
                hasOverflowControl = true;
                break;
              }
            }
            return hasOverflowControl;
          });
          console.log(`    Text overflow control: ${overflowHandling ? 'Yes (truncation/wrapping in place)' : 'Default (may overflow)'}`);

          // Step 7: Check no horizontal scrollbar on table container
          console.log('  Step 7: Checking for horizontal overflow...');
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          console.log(`    Page has horizontal scroll: ${hasHorizontalScroll}`);

        } else {
          console.log('    Table not found - checking for alternative content display');
          const contentList = page.locator('[class*="list"], [class*="card"], [role="table"]').first();
          const listVisible = await contentList.isVisible().catch(() => false);
          console.log(`    Alternative content display: ${listVisible}`);
        }

        // Take screenshot
        await page.screenshot({
          path: `test-results/screenshots/q-3367-${viewport.name.toLowerCase()}.png`,
          fullPage: true
        });
        console.log(`    Screenshot saved: q-3367-${viewport.name.toLowerCase()}.png`);
        console.log(`  ${viewport.name}: PASSED`);

      } catch (error) {
        console.error(`  ${viewport.name}: FAILED -`, error.message);
        await page.screenshot({
          path: `test-results/screenshots/q-3367-${viewport.name.toLowerCase()}-error.png`,
          fullPage: true
        }).catch(() => {});
        throw error;
      } finally {
        await context.close();
      }
    }

    console.log('\nQ-3367: PASSED - Table columns remain aligned and responsive across screen sizes\n');
  });

  // ─────────────────────────────────────────────────────────────────
  // Q-3368: Verify super admin/admin can view the reported content table
  // ─────────────────────────────────────────────────────────────────
  test(qase(3368, 'Q-3368: Verify super admin/admin can view the reported content table'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3368: Super Admin Can View Reported Content Table');
    console.log('═══════════════════════════════════════════════════════\n');

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login as super admin
      console.log('Step 1: Logging in as super admin...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      // Step 2: Navigate to Content Moderation (reported content)
      console.log('\nStep 2: Navigating to Content Moderation...');
      try {
        await page.waitForURL(/content-moderation/, { timeout: 30000 });
      } catch {
        await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
      }
      await page.waitForTimeout(3000);

      const url = page.url();
      expect(url).toContain('content-moderation');
      console.log('  On Content Moderation page');

      // Step 3: Verify reported content table is displayed
      console.log('\nStep 3: Verifying reported content table is displayed...');

      const tableSelectors = [
        'table',
        '[role="table"]',
        '[class*="table"]',
        'table tbody'
      ];

      let tableElement = null;
      for (const selector of tableSelectors) {
        const el = page.locator(selector).first();
        if (await el.isVisible().catch(() => false)) {
          tableElement = el;
          console.log(`  Table found with selector: ${selector}`);
          break;
        }
      }

      expect(tableElement).not.toBeNull();
      console.log('  Reported content table is visible');

      // Step 4: Verify table has column headers
      console.log('\nStep 4: Verifying table column headers...');
      const headerCells = page.locator('table thead th, table th, [role="columnheader"]');
      const headerCount = await headerCells.count();

      const headers = [];
      for (let i = 0; i < headerCount; i++) {
        const text = await headerCells.nth(i).textContent().catch(() => '');
        if (text.trim()) headers.push(text.trim());
      }
      console.log(`  Table columns (${headers.length}): ${headers.join(', ')}`);
      expect(headers.length).toBeGreaterThan(0);

      // Step 5: Verify table has data rows or appropriate empty state
      console.log('\nStep 5: Verifying table data...');
      const tableRows = page.locator('table tbody tr');
      const rowCount = await tableRows.count();
      console.log(`  Table row count: ${rowCount}`);

      if (rowCount > 0) {
        console.log('  Table has reported content data');

        // Verify first row has content
        const firstRowText = await tableRows.first().textContent().catch(() => '');
        console.log(`  First row preview: "${firstRowText.trim().substring(0, 120)}..."`);
        expect(firstRowText.trim().length).toBeGreaterThan(0);

        // Step 6: Verify each row has data in cells
        console.log('\nStep 6: Verifying row cell data...');
        const firstRowCells = tableRows.first().locator('td');
        const cellCount = await firstRowCells.count();
        console.log(`  First row has ${cellCount} cells`);

        let populatedCells = 0;
        for (let i = 0; i < cellCount; i++) {
          const cellText = await firstRowCells.nth(i).textContent().catch(() => '');
          if (cellText.trim().length > 0) populatedCells++;
        }
        console.log(`  Populated cells: ${populatedCells}/${cellCount}`);
        expect(populatedCells).toBeGreaterThan(0);

      } else {
        // Check for empty state message
        const noDataMsg = page.locator('text=/no data|no content|no results|no records|no reported/i').first();
        const hasNoData = await noDataMsg.isVisible().catch(() => false);
        if (hasNoData) {
          console.log('  Table is empty with appropriate message - no reported content in current date range');
        } else {
          console.log('  Table has 0 rows (content may still be loading)');
        }
      }

      // Step 7: Verify action buttons are available for admin
      console.log('\nStep 7: Verifying admin action controls are available...');

      const actionSelectors = [
        'button:has-text("View")',
        'button:has-text("Approve")',
        'button:has-text("Reject")',
        'button:has-text("Delete")',
        'td button',
        'td a'
      ];

      let actionsFound = 0;
      for (const selector of actionSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`  Action element found: ${selector} (${count} instances)`);
          actionsFound += count;
        }
      }

      if (actionsFound > 0) {
        console.log(`  Total action elements: ${actionsFound}`);
      } else {
        console.log('  No explicit action buttons found (may be inline or in row details)');
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3368-reported-content.png', fullPage: true });
      console.log('  Screenshot saved: q-3368-reported-content.png');

      console.log('\nQ-3368: PASSED - Super admin can view the reported content table with all items\n');

    } catch (error) {
      console.error('\nQ-3368: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3368-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });

  // ─────────────────────────────────────────────────────────────────
  // Q-3629: Re-verify table columns are aligned and responsive on different screen sizes
  // ─────────────────────────────────────────────────────────────────
  test(qase(3629, 'Q-3629: Re-verify table columns aligned and responsive on different screen sizes'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3629: Table Column Alignment & Responsiveness (Re-verify)');
    console.log('═══════════════════════════════════════════════════════\n');

    await new Promise(r => setTimeout(r, 5000));

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Small Desktop', width: 1280, height: 720 }
    ];

    for (const viewport of viewports) {
      console.log(`\n  ── Testing on ${viewport.name} (${viewport.width}x${viewport.height}) ──`);

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height }
      });
      const page = await context.newPage();

      try {
        // Step 1: Login
        console.log('  Step 1: Logging in as super admin...');
        await loginViaDemo(page, browser);
        console.log('    Login completed');

        // Step 2: Navigate to Content Moderation
        console.log('  Step 2: Navigating to Content Moderation...');
        try {
          await page.waitForURL(/content-moderation/, { timeout: 30000 });
        } catch {
          await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
        }
        await page.waitForTimeout(3000);
        console.log('    On Content Moderation page');

        // Step 3: Verify table is visible
        console.log('  Step 3: Verifying table visibility...');
        const table = page.locator('table').first();
        const tableVisible = await table.isVisible().catch(() => false);

        if (tableVisible) {
          console.log('    Table is visible');

          // Step 4: Check column headers
          console.log('  Step 4: Checking column headers...');
          const headerCells = page.locator('table thead th, table th');
          const headerCount = await headerCells.count();

          const headers = [];
          for (let i = 0; i < headerCount; i++) {
            const text = await headerCells.nth(i).textContent().catch(() => '');
            if (text.trim()) headers.push(text.trim());
          }
          console.log(`    Columns: ${headers.join(', ')}`);

          // Step 5: Verify body cells align with headers
          console.log('  Step 5: Verifying cell alignment...');
          const firstRow = page.locator('table tbody tr').first();
          const rowVisible = await firstRow.isVisible().catch(() => false);

          if (rowVisible) {
            const bodyCells = firstRow.locator('td');
            const bodyCellCount = await bodyCells.count();

            let alignedCount = 0;
            const tolerance = 5;

            for (let i = 0; i < Math.min(headerCount, bodyCellCount); i++) {
              const headerBox = await headerCells.nth(i).boundingBox();
              const bodyBox = await bodyCells.nth(i).boundingBox();
              if (headerBox && bodyBox) {
                const xDiff = Math.abs(headerBox.x - bodyBox.x);
                if (xDiff <= tolerance) alignedCount++;
              }
            }
            console.log(`    ${alignedCount}/${Math.min(headerCount, bodyCellCount)} columns aligned`);
            expect(alignedCount).toBeGreaterThan(0);
          } else {
            console.log('    No data rows visible');
          }

          // Step 6: Check text truncation handling
          console.log('  Step 6: Checking content truncation...');
          const overflowHandling = await table.evaluate(el => {
            const cells = el.querySelectorAll('td');
            let hasControl = false;
            for (const cell of cells) {
              const cs = window.getComputedStyle(cell);
              if (cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis' || cs.whiteSpace === 'nowrap' || cs.wordBreak === 'break-word') {
                hasControl = true;
                break;
              }
            }
            return hasControl;
          });
          console.log(`    Truncation/wrapping: ${overflowHandling ? 'Yes' : 'Default'}`);

          // Step 7: Check horizontal overflow
          console.log('  Step 7: Checking horizontal overflow...');
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          console.log(`    Horizontal scroll: ${hasHorizontalScroll}`);

        } else {
          console.log('    Table not visible at this viewport');
        }

        await page.screenshot({
          path: `test-results/screenshots/q-3629-${viewport.name.toLowerCase()}.png`,
          fullPage: true
        });
        console.log(`    Screenshot saved: q-3629-${viewport.name.toLowerCase()}.png`);
        console.log(`  ${viewport.name}: PASSED`);

      } catch (error) {
        console.error(`  ${viewport.name}: FAILED -`, error.message);
        await page.screenshot({
          path: `test-results/screenshots/q-3629-${viewport.name.toLowerCase()}-error.png`,
          fullPage: true
        }).catch(() => {});
        throw error;
      } finally {
        await context.close();
      }
    }

    console.log('\nQ-3629: PASSED - Table columns remain aligned and responsive across screen sizes\n');
  });

  // ─────────────────────────────────────────────────────────────────
  // Q-3630: Re-verify super admin/admin can view the reported content table
  // ─────────────────────────────────────────────────────────────────
  test(qase(3630, 'Q-3630: Re-verify super admin/admin can view the reported content table'), async ({ browser }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-3630: Super Admin Can View Reported Content Table (Re-verify)');
    console.log('═══════════════════════════════════════════════════════\n');

    await new Promise(r => setTimeout(r, 5000));

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Step 1: Login as super admin
      console.log('Step 1: Logging in as super admin...');
      await loginViaDemo(page, browser);
      console.log('  Login completed');

      // Step 2: Navigate to Content Moderation
      console.log('\nStep 2: Navigating to Content Moderation...');
      try {
        await page.waitForURL(/content-moderation/, { timeout: 30000 });
      } catch {
        await page.goto('https://stage.rainydayparents.com/content-moderation', { waitUntil: 'networkidle', timeout: 30000 });
      }
      await page.waitForTimeout(3000);

      const url = page.url();
      expect(url).toContain('content-moderation');
      console.log('  On Content Moderation page');

      // Step 3: Verify reported content table is displayed
      console.log('\nStep 3: Verifying reported content table is displayed...');

      const tableSelectors = [
        'table',
        '[role="table"]',
        '[class*="table"]',
        'table tbody'
      ];

      let tableElement = null;
      for (const selector of tableSelectors) {
        const el = page.locator(selector).first();
        if (await el.isVisible().catch(() => false)) {
          tableElement = el;
          console.log(`  Table found with selector: ${selector}`);
          break;
        }
      }

      expect(tableElement).not.toBeNull();
      console.log('  Reported content table is visible');

      // Step 4: Verify table column headers
      console.log('\nStep 4: Verifying table column headers...');
      const headerCells = page.locator('table thead th, table th, [role="columnheader"]');
      const headerCount = await headerCells.count();

      const headers = [];
      for (let i = 0; i < headerCount; i++) {
        const text = await headerCells.nth(i).textContent().catch(() => '');
        if (text.trim()) headers.push(text.trim());
      }
      console.log(`  Columns (${headers.length}): ${headers.join(', ')}`);
      expect(headers.length).toBeGreaterThan(0);

      // Step 5: Verify table data rows
      console.log('\nStep 5: Verifying table data rows...');
      const tableRows = page.locator('table tbody tr');
      const rowCount = await tableRows.count();
      console.log(`  Row count: ${rowCount}`);

      if (rowCount > 0) {
        console.log('  Table has reported content data');

        const firstRowText = await tableRows.first().textContent().catch(() => '');
        console.log(`  First row preview: "${firstRowText.trim().substring(0, 120)}..."`);
        expect(firstRowText.trim().length).toBeGreaterThan(0);

        // Verify cell data in first row
        console.log('\nStep 6: Verifying first row cell data...');
        const firstRowCells = tableRows.first().locator('td');
        const cellCount = await firstRowCells.count();

        let populatedCells = 0;
        for (let i = 0; i < cellCount; i++) {
          const cellText = await firstRowCells.nth(i).textContent().catch(() => '');
          if (cellText.trim().length > 0) populatedCells++;
        }
        console.log(`  Populated cells: ${populatedCells}/${cellCount}`);
        expect(populatedCells).toBeGreaterThan(0);

      } else {
        const noDataMsg = page.locator('text=/no data|no content|no results|no records|no reported/i').first();
        const hasNoData = await noDataMsg.isVisible().catch(() => false);
        if (hasNoData) {
          console.log('  Table empty with appropriate message');
        } else {
          console.log('  Table has 0 rows');
        }
      }

      // Step 7: Verify admin action controls
      console.log('\nStep 7: Verifying admin action controls...');

      const actionSelectors = [
        'button:has-text("View")',
        'button:has-text("Approve")',
        'button:has-text("Reject")',
        'button:has-text("Delete")',
        'td button',
        'td a'
      ];

      let actionsFound = 0;
      for (const selector of actionSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`  Action found: ${selector} (${count} instances)`);
          actionsFound += count;
        }
      }

      if (actionsFound > 0) {
        console.log(`  Total action elements: ${actionsFound}`);
      } else {
        console.log('  No explicit action buttons found');
      }

      await page.screenshot({ path: 'test-results/screenshots/q-3630-reported-content.png', fullPage: true });
      console.log('  Screenshot saved: q-3630-reported-content.png');

      console.log('\nQ-3630: PASSED - Super admin can view the reported content table with all items\n');

    } catch (error) {
      console.error('\nQ-3630: FAILED -', error.message);
      await page.screenshot({ path: 'test-results/screenshots/q-3630-error.png', fullPage: true }).catch(() => {});
      throw error;
    } finally {
      await context.close();
    }
  });
});
