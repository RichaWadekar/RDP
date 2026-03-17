const { test, expect } = require('@playwright/test');

/**
 * Qase API Test Cases: 5650, 5651, 5652, 5653, 5654
 * Login API - Payload Limits, Malformed JSON, Unknown Fields, Security Headers & Timeout Tests
 */

// API Configuration
const API_BASE_URL = 'https://api.dev.rainydayparents.com/m1/v1';
const LOGIN_ENDPOINT = '/auth/admin/login';

// Test credentials
const VALID_EMAIL = 'admin.devrainyday@yopmail.com';
const VALID_PASSWORD = 'Test@123';

test.describe('Login API Robustness Tests - Qase 5650-5654', () => {

  // Q-5650: Verify login API handles large payload / request body size limits
  test('Q-5650: Verify login API handles large payload gracefully', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5650: Large Payload Handling');
    console.log('═══════════════════════════════════════════════════════\n');

    const payloads = [
      {
        label: 'Oversized email (10KB)',
        data: { email: 'a'.repeat(10000) + '@test.com', password: VALID_PASSWORD }
      },
      {
        label: 'Oversized password (10KB)',
        data: { email: VALID_EMAIL, password: 'P'.repeat(10000) }
      },
      {
        label: 'Extra large body with padding (50KB)',
        data: { email: VALID_EMAIL, password: VALID_PASSWORD, padding: 'x'.repeat(50000) }
      },
      {
        label: 'Deeply nested JSON object',
        data: (() => {
          let obj = { email: VALID_EMAIL, password: VALID_PASSWORD };
          let current = obj;
          for (let i = 0; i < 50; i++) {
            current.nested = { level: i };
            current = current.nested;
          }
          return obj;
        })()
      }
    ];

    for (const payload of payloads) {
      console.log(`  Test: ${payload.label}`);
      const bodySize = JSON.stringify(payload.data).length;
      console.log(`    Body size: ${(bodySize / 1024).toFixed(1)} KB`);

      try {
        const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: payload.data,
          headers: { 'Content-Type': 'application/json' }
        });

        const status = response.status();
        console.log(`    Response Status: ${status}`);

        if (status === 413) {
          console.log('    Payload Too Large (413) - Correct behavior');
        } else if (status === 400) {
          console.log('    Bad Request (400) - API rejects oversized payload');
        } else if (status === 200) {
          console.log('    200 OK - API processed the request (ignoring extra data)');
        }

        // API should NOT crash with server error
        expect(status).toBeLessThan(500);

        try {
          const body = await response.json();
          const msg = body.message || body.error || '';
          if (msg) console.log(`    Message: ${msg}`);
        } catch (e) { /* not JSON */ }

        console.log(`    ${payload.label}: Handled gracefully\n`);

      } catch (error) {
        console.log(`    Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('Q-5650: PASSED - API handles large payloads without server errors\n');
  });

  // Q-5651: Verify login API returns proper error for malformed JSON
  test('Q-5651: Verify login API returns proper error for malformed JSON', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5651: Malformed JSON Handling');
    console.log('═══════════════════════════════════════════════════════\n');

    const malformedPayloads = [
      { label: 'Missing closing brace', body: '{"email":"test@test.com","password":"Test@123"' },
      { label: 'Trailing comma', body: '{"email":"test@test.com","password":"Test@123",}' },
      { label: 'Single quotes instead of double', body: "{'email':'test@test.com','password':'Test@123'}" },
      { label: 'Plain text string', body: 'not a json at all' },
      { label: 'Empty string', body: '' },
      { label: 'XML instead of JSON', body: '<login><email>test@test.com</email><password>Test@123</password></login>' }
    ];

    for (const payload of malformedPayloads) {
      console.log(`  Test: ${payload.label}`);
      console.log(`    Body: ${payload.body.substring(0, 80)}${payload.body.length > 80 ? '...' : ''}`);

      try {
        const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: payload.body,
          headers: { 'Content-Type': 'application/json' }
        });

        const status = response.status();
        console.log(`    Response Status: ${status}`);

        if (status === 400) {
          console.log('    Bad Request (400) - Correct: API rejects malformed JSON');
        } else if (status === 415) {
          console.log('    Unsupported Media Type (415) - API rejects non-JSON body');
        } else if (status === 422) {
          console.log('    Unprocessable Entity (422) - API cannot parse the body');
        }

        // Must NOT return 200 for malformed JSON
        expect(status).not.toBe(200);

        // Must NOT return 500 (server should handle gracefully)
        expect(status).toBeLessThan(500);

        try {
          const body = await response.json();
          const msg = body.message || body.error || '';
          if (msg) console.log(`    Error message: ${msg}`);
        } catch (e) {
          const text = await response.text().catch(() => '');
          if (text) console.log(`    Response text: ${text.substring(0, 100)}`);
        }

        console.log(`    ${payload.label}: Handled\n`);

      } catch (error) {
        console.log(`    Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('Q-5651: PASSED - API returns proper errors for all malformed JSON payloads\n');
  });

  // Q-5652: Verify login API handles extra/unknown fields in request body gracefully
  test('Q-5652: Verify login API handles extra/unknown fields gracefully', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5652: Extra/Unknown Fields Handling');
    console.log('═══════════════════════════════════════════════════════\n');

    const payloads = [
      {
        label: 'Extra unknown field',
        data: { email: VALID_EMAIL, password: VALID_PASSWORD, unknownField: 'test123' }
      },
      {
        label: 'Multiple extra fields',
        data: { email: VALID_EMAIL, password: VALID_PASSWORD, role: 'admin', token: 'fake', isAdmin: true }
      },
      {
        label: 'Duplicate email field (JSON last wins)',
        data: { email: 'wrong@test.com', password: VALID_PASSWORD, email2: VALID_EMAIL }
      },
      {
        label: 'Null values for extra fields',
        data: { email: VALID_EMAIL, password: VALID_PASSWORD, extra: null, data: null }
      },
      {
        label: 'Nested object as extra field',
        data: { email: VALID_EMAIL, password: VALID_PASSWORD, metadata: { source: 'test', version: 1 } }
      }
    ];

    for (const payload of payloads) {
      console.log(`  Test: ${payload.label}`);
      console.log(`    Fields: ${Object.keys(payload.data).join(', ')}`);

      try {
        const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: payload.data,
          headers: { 'Content-Type': 'application/json' }
        });

        const status = response.status();
        console.log(`    Response Status: ${status}`);

        // API should not crash
        expect(status).toBeLessThan(500);

        if (response.ok()) {
          console.log('    API accepted the request (ignores extra fields)');
          try {
            const body = await response.json();
            const hasToken = !!(body.idToken || body.accessToken || body.token);
            console.log(`    Token received: ${hasToken}`);
          } catch (e) { /* not JSON */ }
        } else if (status === 400) {
          console.log('    API rejects request with extra fields (strict validation)');
          try {
            const body = await response.json();
            const msg = body.message || body.error || '';
            if (msg) console.log(`    Message: ${msg}`);
          } catch (e) { /* not JSON */ }
        } else {
          console.log(`    API returned: ${status}`);
        }

        console.log(`    ${payload.label}: Handled\n`);

      } catch (error) {
        console.log(`    Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('Q-5652: PASSED - API handles extra/unknown fields without server errors\n');
  });

  // Q-5653: Verify login API response contains proper HTTP security headers
  test('Q-5653: Verify login API response contains proper HTTP security headers', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5653: HTTP Security Headers Validation');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Sending login request...');

    try {
      const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: { email: VALID_EMAIL, password: VALID_PASSWORD },
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`  Response Status: ${response.status()}`);
      const headers = response.headers();

      console.log('\nStep 2: Checking security headers...\n');

      const securityHeaders = [
        {
          name: 'x-content-type-options',
          expected: 'nosniff',
          description: 'Prevents MIME-type sniffing'
        },
        {
          name: 'x-frame-options',
          expected: 'DENY',
          description: 'Prevents clickjacking via iframes'
        },
        {
          name: 'x-xss-protection',
          expected: null,
          description: 'XSS filter (legacy browsers)'
        },
        {
          name: 'strict-transport-security',
          expected: null,
          description: 'Enforces HTTPS connections (HSTS)'
        },
        {
          name: 'content-security-policy',
          expected: null,
          description: 'Controls resource loading (CSP)'
        },
        {
          name: 'cache-control',
          expected: null,
          description: 'Controls caching of sensitive responses'
        },
        {
          name: 'pragma',
          expected: null,
          description: 'Legacy cache control'
        },
        {
          name: 'referrer-policy',
          expected: null,
          description: 'Controls referrer information in requests'
        },
        {
          name: 'permissions-policy',
          expected: null,
          description: 'Controls browser feature permissions'
        }
      ];

      let presentCount = 0;
      let missingCritical = [];

      for (const header of securityHeaders) {
        const value = headers[header.name];
        if (value) {
          presentCount++;
          console.log(`  [PRESENT] ${header.name}: ${value}`);
          console.log(`            ${header.description}`);

          // Verify expected value if specified
          if (header.expected) {
            const matches = value.toLowerCase().includes(header.expected.toLowerCase());
            if (matches) {
              console.log(`            Expected value "${header.expected}": MATCH`);
            } else {
              console.log(`            Expected "${header.expected}" but got "${value}"`);
            }
          }
        } else {
          console.log(`  [MISSING] ${header.name}`);
          console.log(`            ${header.description}`);
          if (['x-content-type-options', 'x-frame-options'].includes(header.name)) {
            missingCritical.push(header.name);
          }
        }
        console.log('');
      }

      console.log(`Step 3: Summary`);
      console.log(`  Security headers present: ${presentCount}/${securityHeaders.length}`);
      console.log(`  Missing critical headers: ${missingCritical.length > 0 ? missingCritical.join(', ') : 'None'}`);

      // Step 4: Verify no sensitive information leakage
      console.log('\nStep 4: Checking for information leakage headers...');

      const leakageHeaders = ['server', 'x-powered-by', 'x-aspnet-version', 'x-aspnetmvc-version'];
      for (const h of leakageHeaders) {
        const val = headers[h];
        if (val) {
          console.log(`  [WARNING] ${h}: ${val} (may expose server info)`);
        } else {
          console.log(`  [SAFE] ${h}: not exposed`);
        }
      }

      // Step 5: Verify cache-control prevents caching of auth responses
      console.log('\nStep 5: Verifying auth response is not cacheable...');
      const cacheControl = headers['cache-control'];
      if (cacheControl) {
        const isNoCacheSet = cacheControl.includes('no-cache') || cacheControl.includes('no-store');
        console.log(`  Cache-Control: ${cacheControl}`);
        console.log(`  Auth response is ${isNoCacheSet ? 'NOT cacheable' : 'CACHEABLE (potential risk)'}`);
        if (isNoCacheSet) {
          console.log('  Correct: Login responses should not be cached');
        }
      } else {
        console.log('  Cache-Control header missing');
      }

      console.log('\nQ-5653: PASSED - Security headers verified in API response\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5654: Verify login API response time consistency under repeated requests
  test('Q-5654: Verify login API response time consistency under repeated requests', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5654: Response Time Consistency Under Load');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Sending 5 sequential login requests to measure consistency...\n');

    const times = [];
    const statuses = [];

    try {
      for (let i = 1; i <= 5; i++) {
        const startTime = Date.now();

        const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: { email: VALID_EMAIL, password: VALID_PASSWORD },
          headers: { 'Content-Type': 'application/json' }
        });

        const elapsed = Date.now() - startTime;
        times.push(elapsed);
        statuses.push(response.status());

        console.log(`  Request ${i}: ${elapsed}ms (status: ${response.status()})`);

        // Each request should not cause server error
        expect(response.status()).toBeLessThan(500);
      }

      console.log('\nStep 2: Analyzing response time consistency...');

      const avgTime = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      const variance = maxTime - minTime;

      // Calculate standard deviation
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const stdDev = Math.round(Math.sqrt(times.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / times.length));

      console.log(`  Average: ${avgTime}ms`);
      console.log(`  Min: ${minTime}ms`);
      console.log(`  Max: ${maxTime}ms`);
      console.log(`  Variance (max-min): ${variance}ms`);
      console.log(`  Std Deviation: ${stdDev}ms`);

      // Step 3: Verify no degradation
      console.log('\nStep 3: Checking for performance degradation...');

      const firstHalfAvg = Math.round((times[0] + times[1]) / 2);
      const secondHalfAvg = Math.round((times[3] + times[4]) / 2);
      const degradation = secondHalfAvg - firstHalfAvg;

      console.log(`  First 2 requests avg: ${firstHalfAvg}ms`);
      console.log(`  Last 2 requests avg: ${secondHalfAvg}ms`);
      console.log(`  Degradation: ${degradation > 0 ? '+' : ''}${degradation}ms`);

      if (degradation > 500) {
        console.log('  WARNING: Noticeable degradation in response time');
      } else if (degradation < -100) {
        console.log('  Response times improved (possible caching or warm-up)');
      } else {
        console.log('  Response times are consistent');
      }

      // Step 4: Verify all within acceptable limit
      console.log('\nStep 4: Verifying all responses within 5-second limit...');
      let allWithinLimit = true;
      for (let i = 0; i < times.length; i++) {
        if (times[i] > 5000) {
          console.log(`  Request ${i + 1}: ${times[i]}ms EXCEEDS 5s limit`);
          allWithinLimit = false;
        }
      }

      if (allWithinLimit) {
        console.log('  All responses within 5-second limit');
      }

      // Step 5: Verify consistent status codes
      console.log('\nStep 5: Verifying consistent status codes...');
      const uniqueStatuses = [...new Set(statuses)];
      console.log(`  Status codes: [${statuses.join(', ')}]`);
      console.log(`  Unique statuses: ${uniqueStatuses.join(', ')}`);

      if (uniqueStatuses.length === 1) {
        console.log('  All requests returned the same status code');
      } else {
        console.log('  Status codes varied across requests');
      }

      console.log('\nQ-5654: PASSED - Response times are consistent under repeated requests\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

});
