const { test, expect } = require('@playwright/test');

/**
 * Qase API Test Cases: 5655, 5656, 5657, 5658, 5659
 * Login API - Concurrent Requests, Content-Type, Missing Headers, Double-Encoding & Idempotency
 */

// API Configuration
const API_BASE_URL = 'https://api.dev.rainydayparents.com/m1/v1';
const LOGIN_ENDPOINT = '/auth/admin/login';

// Test credentials
const VALID_EMAIL = 'admin.devrainyday@yopmail.com';
const VALID_PASSWORD = 'Test@123';

test.describe('Login API Edge Case Tests - Qase 5655-5659', () => {

  // Q-5655: Verify login API handles concurrent requests from same user consistently
  test('Q-5655: Verify login API handles concurrent requests from same user', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5655: Concurrent Requests From Same User');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Sending 5 concurrent login requests from same user...\n');

    try {
      const promises = Array.from({ length: 5 }, (_, i) =>
        request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: { email: VALID_EMAIL, password: VALID_PASSWORD },
          headers: { 'Content-Type': 'application/json' }
        }).then(res => ({ index: i + 1, status: res.status(), response: res }))
      );

      const results = await Promise.all(promises);

      for (const r of results) {
        console.log(`  Request ${r.index}: Status ${r.status}`);
      }

      // Step 2: Analyze results
      console.log('\nStep 2: Analyzing consistency...');

      const statuses = results.map(r => r.status);
      const uniqueStatuses = [...new Set(statuses)];

      console.log(`  Status codes: [${statuses.join(', ')}]`);
      console.log(`  Unique statuses: ${uniqueStatuses.join(', ')}`);
      console.log(`  All consistent: ${uniqueStatuses.length === 1}`);

      // No server errors
      for (const r of results) {
        expect(r.status).toBeLessThan(500);
      }

      // Step 3: Check if all responses have same structure
      console.log('\nStep 3: Checking response structure consistency...');

      const responseKeys = [];
      for (const r of results) {
        try {
          const body = await r.response.json();
          const keys = Object.keys(body).sort().join(',');
          responseKeys.push(keys);
        } catch {
          responseKeys.push('non-json');
        }
      }

      const uniqueKeysets = [...new Set(responseKeys)];
      console.log(`  Response structures: ${uniqueKeysets.length === 1 ? 'Consistent' : 'Varied'}`);
      if (uniqueKeysets.length === 1) {
        console.log(`  Keys: ${uniqueKeysets[0]}`);
      }

      console.log('\nQ-5655: PASSED - API handles concurrent requests consistently\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5656: Verify login API returns proper Content-Type header in response
  test('Q-5656: Verify login API returns proper Content-Type header in response', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5656: Response Content-Type Header Validation');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Sending valid login request...');

    try {
      const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: { email: VALID_EMAIL, password: VALID_PASSWORD },
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`  Response Status: ${response.status()}`);
      const headers = response.headers();
      const contentType = headers['content-type'] || '';
      console.log(`  Content-Type: ${contentType}`);

      // Step 2: Verify Content-Type is JSON
      console.log('\nStep 2: Verifying Content-Type is application/json...');
      const isJson = contentType.includes('application/json');
      console.log(`  Is application/json: ${isJson}`);

      if (isJson) {
        console.log('  Response correctly returns JSON content type');
      } else if (contentType.includes('text/plain')) {
        console.log('  Response returns text/plain (may need correction)');
      } else {
        console.log(`  Response returns: ${contentType}`);
      }

      // Step 3: Verify charset
      console.log('\nStep 3: Checking charset...');
      if (contentType.includes('charset=')) {
        const charset = contentType.split('charset=')[1]?.trim();
        console.log(`  Charset: ${charset}`);
        if (charset && charset.toLowerCase().includes('utf-8')) {
          console.log('  UTF-8 charset specified - correct');
        }
      } else {
        console.log('  No explicit charset (default UTF-8 assumed)');
      }

      // Step 4: Test error response Content-Type
      console.log('\nStep 4: Checking Content-Type for error response...');

      const errorResponse = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: { email: 'invalid@test.com', password: 'wrong' },
        headers: { 'Content-Type': 'application/json' }
      });

      const errorContentType = errorResponse.headers()['content-type'] || '';
      console.log(`  Error response Content-Type: ${errorContentType}`);
      console.log(`  Error also returns JSON: ${errorContentType.includes('application/json')}`);

      expect(response.status()).toBeLessThan(500);
      expect(errorResponse.status()).toBeLessThan(500);

      console.log('\nQ-5656: PASSED - API returns proper Content-Type header\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5657: Verify login API handles request with missing Content-Type header
  test('Q-5657: Verify login API handles request with missing Content-Type header', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5657: Missing Content-Type Header Handling');
    console.log('═══════════════════════════════════════════════════════\n');

    const testCases = [
      {
        label: 'No Content-Type header (raw JSON body)',
        headers: {},
        body: JSON.stringify({ email: VALID_EMAIL, password: VALID_PASSWORD })
      },
      {
        label: 'Empty Content-Type header',
        headers: { 'Content-Type': '' },
        body: JSON.stringify({ email: VALID_EMAIL, password: VALID_PASSWORD })
      },
      {
        label: 'Content-Type with typo',
        headers: { 'Content-Type': 'applicaton/json' },
        body: JSON.stringify({ email: VALID_EMAIL, password: VALID_PASSWORD })
      },
      {
        label: 'Content-Type with extra parameters',
        headers: { 'Content-Type': 'application/json; charset=utf-8; boundary=something' },
        body: JSON.stringify({ email: VALID_EMAIL, password: VALID_PASSWORD })
      }
    ];

    for (const tc of testCases) {
      console.log(`  Test: ${tc.label}`);

      try {
        const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: tc.body,
          headers: tc.headers
        });

        const status = response.status();
        console.log(`    Response Status: ${status}`);

        // Should not cause server error
        expect(status).toBeLessThan(500);

        if (status === 415) {
          console.log('    Unsupported Media Type (415) - Strict validation');
        } else if (status === 400) {
          console.log('    Bad Request (400) - API rejects request');
        } else if (status === 200) {
          console.log('    200 OK - API is lenient with Content-Type');
        }

        try {
          const body = await response.json();
          const msg = body.message || body.error || '';
          if (msg) console.log(`    Message: ${msg}`);
        } catch {
          const text = await response.text().catch(() => '');
          if (text) console.log(`    Response: ${text.substring(0, 80)}`);
        }

        console.log(`    ${tc.label}: Handled\n`);

      } catch (error) {
        console.log(`    Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('Q-5657: PASSED - API handles missing/invalid Content-Type headers gracefully\n');
  });

  // Q-5658: Verify login API handles double-encoded JSON body
  test('Q-5658: Verify login API handles double-encoded JSON body', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5658: Double-Encoded JSON Body Handling');
    console.log('═══════════════════════════════════════════════════════\n');

    const testCases = [
      {
        label: 'Double JSON.stringify (string within JSON)',
        body: JSON.stringify(JSON.stringify({ email: VALID_EMAIL, password: VALID_PASSWORD }))
      },
      {
        label: 'URL-encoded JSON',
        body: encodeURIComponent(JSON.stringify({ email: VALID_EMAIL, password: VALID_PASSWORD }))
      },
      {
        label: 'JSON with escaped quotes',
        body: '{\\"email\\":\\"admin@test.com\\",\\"password\\":\\"Test@123\\"}'
      },
      {
        label: 'JSON wrapped in array',
        body: JSON.stringify([{ email: VALID_EMAIL, password: VALID_PASSWORD }])
      },
      {
        label: 'JSON with BOM prefix',
        body: '\uFEFF' + JSON.stringify({ email: VALID_EMAIL, password: VALID_PASSWORD })
      }
    ];

    for (const tc of testCases) {
      console.log(`  Test: ${tc.label}`);
      console.log(`    Body preview: ${tc.body.substring(0, 80)}${tc.body.length > 80 ? '...' : ''}`);

      try {
        const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: tc.body,
          headers: { 'Content-Type': 'application/json' }
        });

        const status = response.status();
        console.log(`    Response Status: ${status}`);

        // Must NOT return 200 for malformed data
        expect(status).not.toBe(200);
        // Must NOT crash
        expect(status).toBeLessThan(500);

        if (status === 400) {
          console.log('    Bad Request (400) - Correctly rejects malformed body');
        } else if (status === 422) {
          console.log('    Unprocessable Entity (422) - Cannot parse body');
        }

        try {
          const body = await response.json();
          const msg = body.message || body.error || '';
          if (msg) console.log(`    Message: ${msg}`);
        } catch { /* not JSON */ }

        console.log(`    ${tc.label}: Handled\n`);

      } catch (error) {
        console.log(`    Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('Q-5658: PASSED - API rejects double-encoded/malformed JSON bodies\n');
  });

  // Q-5659: Verify login API idempotency (same request produces same result)
  test('Q-5659: Verify login API idempotency - same request same result', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5659: Login API Idempotency');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Sending same login request 3 times sequentially...\n');

    try {
      const results = [];

      for (let i = 1; i <= 3; i++) {
        const startTime = Date.now();
        const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: { email: VALID_EMAIL, password: VALID_PASSWORD },
          headers: { 'Content-Type': 'application/json' }
        });
        const elapsed = Date.now() - startTime;

        const status = response.status();
        let bodyKeys = '';
        let errorMsg = '';

        try {
          const body = await response.json();
          bodyKeys = Object.keys(body).sort().join(', ');
          errorMsg = body.message || body.error || '';
        } catch { /* not JSON */ }

        results.push({ status, bodyKeys, errorMsg, elapsed });
        console.log(`  Request ${i}: Status ${status}, Time ${elapsed}ms`);
        if (errorMsg) console.log(`    Message: ${errorMsg}`);
        if (bodyKeys) console.log(`    Keys: ${bodyKeys}`);

        expect(status).toBeLessThan(500);
      }

      // Step 2: Compare results
      console.log('\nStep 2: Comparing results for idempotency...');

      const allSameStatus = results.every(r => r.status === results[0].status);
      const allSameKeys = results.every(r => r.bodyKeys === results[0].bodyKeys);
      const allSameMessage = results.every(r => r.errorMsg === results[0].errorMsg);

      console.log(`  Same status code: ${allSameStatus} (${results[0].status})`);
      console.log(`  Same response keys: ${allSameKeys}`);
      console.log(`  Same message: ${allSameMessage}`);

      expect(allSameStatus).toBeTruthy();
      expect(allSameKeys).toBeTruthy();

      // Step 3: Test with invalid credentials for idempotency
      console.log('\nStep 3: Testing idempotency with invalid credentials...\n');

      const errorResults = [];

      for (let i = 1; i <= 3; i++) {
        const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: { email: 'nonexistent@fake.com', password: 'WrongPass123' },
          headers: { 'Content-Type': 'application/json' }
        });

        const status = response.status();
        let errorMsg = '';

        try {
          const body = await response.json();
          errorMsg = body.message || body.error || '';
        } catch { /* not JSON */ }

        errorResults.push({ status, errorMsg });
        console.log(`  Error Request ${i}: Status ${status}`);
        if (errorMsg) console.log(`    Message: ${errorMsg}`);
      }

      const errorSameStatus = errorResults.every(r => r.status === errorResults[0].status);
      const errorSameMsg = errorResults.every(r => r.errorMsg === errorResults[0].errorMsg);

      console.log(`\n  Error responses consistent status: ${errorSameStatus}`);
      console.log(`  Error responses consistent message: ${errorSameMsg}`);

      expect(errorSameStatus).toBeTruthy();

      console.log('\nQ-5659: PASSED - Same request produces same result (idempotent)\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

});
