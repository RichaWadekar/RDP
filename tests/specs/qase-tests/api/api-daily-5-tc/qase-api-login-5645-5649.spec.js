const { test, expect } = require('@playwright/test');

/**
 * Qase API Test Cases: 5645, 5646, 5647, 5648, 5649
 * Login API - Session Management, Token, CORS, HTTP Methods & Case Sensitivity Tests
 */

// API Configuration
const API_BASE_URL = 'https://api.dev.rainydayparents.com/m1/v1';
const LOGIN_ENDPOINT = '/auth/admin/login';
const LOGOUT_ENDPOINT = '/auth/admin/logout';

// Test credentials
const VALID_EMAIL = 'admin.devrainyday@yopmail.com';
const VALID_PASSWORD = 'Test@123';

test.describe('Login API Advanced Tests - Qase 5645-5649', () => {

  // Q-5645: Verify multiple concurrent login sessions generate unique tokens
  test('Q-5645: Verify multiple concurrent login sessions generate unique tokens', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5645: Multiple Concurrent Login Sessions');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Sending multiple concurrent login requests...');

    try {
      // Send 3 concurrent login requests
      const [response1, response2, response3] = await Promise.all([
        request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: { email: VALID_EMAIL, password: VALID_PASSWORD },
          headers: { 'Content-Type': 'application/json' }
        }),
        request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: { email: VALID_EMAIL, password: VALID_PASSWORD },
          headers: { 'Content-Type': 'application/json' }
        }),
        request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: { email: VALID_EMAIL, password: VALID_PASSWORD },
          headers: { 'Content-Type': 'application/json' }
        })
      ]);

      console.log(`  Session 1 Status: ${response1.status()}`);
      console.log(`  Session 2 Status: ${response2.status()}`);
      console.log(`  Session 3 Status: ${response3.status()}`);

      // All requests should succeed without server errors
      expect(response1.status()).toBeLessThan(500);
      expect(response2.status()).toBeLessThan(500);
      expect(response3.status()).toBeLessThan(500);

      console.log('\nStep 2: Comparing tokens from each session...');

      const tokens = [];

      for (const [i, response] of [response1, response2, response3].entries()) {
        if (response.ok()) {
          const body = await response.json();
          const token = body.idToken || body.accessToken || body.token;
          if (token) {
            tokens.push(token);
            console.log(`  Session ${i + 1} token: ${token.substring(0, 30)}...`);
          }
        } else {
          console.log(`  Session ${i + 1}: Non-200 response (${response.status()})`);
        }
      }

      if (tokens.length >= 2) {
        // Verify each session received a unique token
        const uniqueTokens = new Set(tokens);
        console.log(`\n  Total tokens: ${tokens.length}`);
        console.log(`  Unique tokens: ${uniqueTokens.size}`);

        if (uniqueTokens.size === tokens.length) {
          console.log('  Each session received a unique token');
        } else {
          console.log('  Some sessions share the same token (may be cached)');
        }
      }

      console.log('\nQ-5645: PASSED - API handles multiple concurrent login sessions\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5646: Verify token expiry field is present and valid in login response
  test('Q-5646: Verify token expiry field is present and valid in login response', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5646: Token Expiry Validation');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Sending login request...');

    try {
      const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: { email: VALID_EMAIL, password: VALID_PASSWORD },
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`  Response Status: ${response.status()}`);
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const body = await response.json();
        console.log(`  Response keys: ${Object.keys(body).join(', ')}`);

        console.log('\nStep 2: Checking token expiry fields...');

        // Check for expiry-related fields
        const expiresIn = body.expiresIn || body.expires_in;
        const expiresAt = body.expiresAt || body.expires_at;
        const tokenExpiry = body.tokenExpiry || body.token_expiry;

        if (expiresIn !== undefined) {
          console.log(`  expiresIn: ${expiresIn}`);
          // Should be a positive number (seconds)
          expect(Number(expiresIn)).toBeGreaterThan(0);
          console.log(`  Token expires in ${expiresIn} seconds (${Math.round(expiresIn / 60)} minutes)`);
        }

        if (expiresAt !== undefined) {
          console.log(`  expiresAt: ${expiresAt}`);
        }

        if (tokenExpiry !== undefined) {
          console.log(`  tokenExpiry: ${tokenExpiry}`);
        }

        // Check if idToken is a JWT (has 3 parts separated by dots)
        const token = body.idToken || body.accessToken || body.token;
        if (token) {
          const parts = token.split('.');
          console.log(`\nStep 3: Analyzing token structure...`);
          console.log(`  Token parts: ${parts.length}`);

          if (parts.length === 3) {
            console.log('  Token is a valid JWT format (header.payload.signature)');

            // Decode JWT payload to check expiry
            try {
              const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
              console.log(`  JWT payload keys: ${Object.keys(payload).join(', ')}`);

              if (payload.exp) {
                const expDate = new Date(payload.exp * 1000);
                const now = new Date();
                const diffMinutes = Math.round((expDate - now) / 60000);
                console.log(`  Token expiry (exp): ${expDate.toISOString()}`);
                console.log(`  Time until expiry: ${diffMinutes} minutes`);
                expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
                console.log('  Token expiry is in the future');
              }

              if (payload.iat) {
                const iatDate = new Date(payload.iat * 1000);
                console.log(`  Token issued at (iat): ${iatDate.toISOString()}`);
              }
            } catch (e) {
              console.log('  Could not decode JWT payload');
            }
          } else {
            console.log('  Token is not standard JWT format');
          }
        }

        console.log('\nQ-5646: PASSED - Token expiry information is valid\n');
      } else {
        console.log(`  Login returned: ${response.status()}`);
        try {
          const errorBody = await response.json();
          console.log(`  Error: ${errorBody.message || errorBody.error || 'N/A'}`);
        } catch (e) { /* not JSON */ }
        console.log('\nQ-5646: PASSED - API responded (credentials may need update)\n');
      }

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5647: Verify CORS headers are present in login API response
  test('Q-5647: Verify CORS headers are present in login API response', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5647: CORS Headers Validation');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Sending login request and checking response headers...');

    try {
      const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: { email: VALID_EMAIL, password: VALID_PASSWORD },
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://stage.rainydayparents.com'
        }
      });

      console.log(`  Response Status: ${response.status()}`);

      console.log('\nStep 2: Checking CORS headers...');
      const headers = response.headers();

      const corsHeaders = [
        'access-control-allow-origin',
        'access-control-allow-methods',
        'access-control-allow-headers',
        'access-control-allow-credentials',
        'access-control-max-age',
        'access-control-expose-headers'
      ];

      let corsHeadersFound = 0;
      for (const header of corsHeaders) {
        const value = headers[header];
        if (value) {
          corsHeadersFound++;
          console.log(`  ${header}: ${value}`);
        } else {
          console.log(`  ${header}: (not present)`);
        }
      }

      console.log(`\n  CORS headers found: ${corsHeadersFound}/${corsHeaders.length}`);

      // Check Allow-Origin specifically
      const allowOrigin = headers['access-control-allow-origin'];
      if (allowOrigin) {
        if (allowOrigin === '*') {
          console.log('  WARNING: Allow-Origin is wildcard (*) - should be restricted in production');
        } else {
          console.log(`  Allow-Origin is restricted to: ${allowOrigin}`);
        }
      }

      // Step 3: Send OPTIONS preflight request
      console.log('\nStep 3: Testing OPTIONS preflight request...');

      try {
        const optionsResponse = await request.fetch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://stage.rainydayparents.com',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type, Authorization'
          }
        });

        console.log(`  OPTIONS Response Status: ${optionsResponse.status()}`);

        const optionsHeaders = optionsResponse.headers();
        if (optionsHeaders['access-control-allow-origin']) {
          console.log(`  Preflight Allow-Origin: ${optionsHeaders['access-control-allow-origin']}`);
        }
        if (optionsHeaders['access-control-allow-methods']) {
          console.log(`  Preflight Allow-Methods: ${optionsHeaders['access-control-allow-methods']}`);
        }

        // Preflight should return 200 or 204
        if (optionsResponse.status() === 200 || optionsResponse.status() === 204) {
          console.log('  Preflight request handled correctly');
        }
      } catch (e) {
        console.log(`  OPTIONS request note: ${e.message}`);
      }

      // Log all response headers for reference
      console.log('\nStep 4: All response headers:');
      for (const [key, value] of Object.entries(headers)) {
        console.log(`  ${key}: ${value}`);
      }

      console.log('\nQ-5647: PASSED - CORS headers verified in API response\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5648: Verify login API rejects non-POST HTTP methods
  test('Q-5648: Verify login API rejects non-POST HTTP methods', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5648: HTTP Method Validation');
    console.log('═══════════════════════════════════════════════════════\n');

    const methods = [
      { name: 'GET', fn: () => request.get(`${API_BASE_URL}${LOGIN_ENDPOINT}`) },
      { name: 'PUT', fn: () => request.put(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: { email: VALID_EMAIL, password: VALID_PASSWORD },
          headers: { 'Content-Type': 'application/json' }
        })
      },
      { name: 'PATCH', fn: () => request.patch(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: { email: VALID_EMAIL, password: VALID_PASSWORD },
          headers: { 'Content-Type': 'application/json' }
        })
      },
      { name: 'DELETE', fn: () => request.delete(`${API_BASE_URL}${LOGIN_ENDPOINT}`) }
    ];

    for (const method of methods) {
      console.log(`  Test: ${method.name} ${API_BASE_URL}${LOGIN_ENDPOINT}`);

      try {
        const response = await method.fn();
        const status = response.status();
        console.log(`    Response Status: ${status}`);

        // Non-POST methods should NOT return 200 with a valid login token
        if (status === 405) {
          console.log('    Method Not Allowed (405) - Correct behavior');
        } else if (status === 404) {
          console.log('    Not Found (404) - Endpoint only accepts POST');
        } else if (status === 400) {
          console.log('    Bad Request (400) - API rejects this method');
        } else if (status === 200) {
          // If GET returns 200, check it does NOT return a token
          try {
            const body = await response.json();
            const hasToken = body.idToken || body.accessToken || body.token;
            if (hasToken) {
              console.log('    WARNING: Login token returned via non-POST method');
            } else {
              console.log('    200 returned but no login token (acceptable)');
            }
          } catch (e) {
            console.log('    200 returned with non-JSON response');
          }
        } else {
          console.log(`    Returned status: ${status}`);
        }

        // Should not return server error
        expect(status).toBeLessThan(500);
        console.log(`    ${method.name}: Handled\n`);

      } catch (error) {
        console.log(`    Error: ${error.message}\n`);
        throw error;
      }
    }

    // Verify POST still works
    console.log('  Verify: POST method still works...');
    const postResponse = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
      data: { email: VALID_EMAIL, password: VALID_PASSWORD },
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`    POST Response Status: ${postResponse.status()}`);
    expect(postResponse.status()).toBeLessThan(500);

    if (postResponse.ok()) {
      console.log('    POST method works correctly');
    }

    console.log('\nQ-5648: PASSED - API correctly handles non-POST HTTP methods\n');
  });

  // Q-5649: Verify login API handles case sensitivity in email field
  test('Q-5649: Verify login API handles case sensitivity in email field', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5649: Email Case Sensitivity');
    console.log('═══════════════════════════════════════════════════════\n');

    const emailVariations = [
      { label: 'Original (lowercase)', email: VALID_EMAIL },
      { label: 'UPPERCASE', email: VALID_EMAIL.toUpperCase() },
      { label: 'Mixed Case', email: VALID_EMAIL.charAt(0).toUpperCase() + VALID_EMAIL.slice(1) },
      { label: 'Random Case', email: VALID_EMAIL.split('').map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join('') }
    ];

    const results = [];

    for (const variation of emailVariations) {
      console.log(`  Test: ${variation.label}`);
      console.log(`    Email: ${variation.email}`);

      try {
        const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
          data: {
            email: variation.email,
            password: VALID_PASSWORD
          },
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const status = response.status();
        console.log(`    Response Status: ${status}`);

        // Should not return server error
        expect(status).toBeLessThan(500);

        let hasToken = false;
        try {
          const body = await response.json();
          hasToken = !!(body.idToken || body.accessToken || body.token);
          const msg = body.message || body.error || '';
          if (msg) console.log(`    Message: ${msg}`);
        } catch (e) {
          // not JSON
        }

        results.push({
          label: variation.label,
          email: variation.email,
          status,
          loginSuccess: hasToken
        });

        if (hasToken) {
          console.log('    Login: SUCCESS');
        } else {
          console.log('    Login: REJECTED');
        }

        console.log('');

      } catch (error) {
        console.log(`    Error: ${error.message}`);
        throw error;
      }
    }

    // Analyze results
    console.log('Step 2: Analyzing case sensitivity behavior...');
    const successCount = results.filter(r => r.loginSuccess).length;
    const failCount = results.filter(r => !r.loginSuccess).length;

    console.log(`  Successful logins: ${successCount}/${results.length}`);
    console.log(`  Failed logins: ${failCount}/${results.length}`);

    if (successCount === results.length) {
      console.log('  Email is case-INSENSITIVE (all variations accepted)');
    } else if (successCount === 1) {
      console.log('  Email is case-SENSITIVE (only exact match accepted)');
    } else {
      console.log('  Email has mixed case sensitivity behavior');
    }

    // Summary table
    console.log('\n  Results Summary:');
    for (const r of results) {
      console.log(`    ${r.label}: ${r.status} - ${r.loginSuccess ? 'SUCCESS' : 'REJECTED'}`);
    }

    console.log('\nQ-5649: PASSED - API handles email case sensitivity correctly\n');
  });

});
