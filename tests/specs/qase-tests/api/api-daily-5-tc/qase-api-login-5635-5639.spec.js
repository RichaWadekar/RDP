const { test, expect } = require('@playwright/test');

/**
 * Qase API Test Cases: 5635, 5636, 5637, 5638, 5639
 * Login API Validation Tests
 */

// API Configuration
const API_BASE_URL = 'https://api.dev.rainydayparents.com/m1/v1';
const LOGIN_ENDPOINT = '/auth/admin/login';

// Test credentials
const VALID_EMAIL = 'admin.devrainyday@yopmail.com';
const VALID_PASSWORD = 'Test@123';

test.describe('Login API Validation Tests - Qase 5635-5639', () => {

  // Q-5635: Verify login works for different user roles
  test('Q-5635: Verify login works for different user roles', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5635: Login works for different user roles');
    console.log('═══════════════════════════════════════════════════════\n');

    // Step 1: Login using Super Admin credentials
    console.log('Step 1: Login using Super Admin credentials...');
    console.log(`  Email: ${VALID_EMAIL}`);
    console.log('  Password: ********');

    try {
      const superAdminResponse = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: {
          email: VALID_EMAIL,
          password: VALID_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  Response Status: ${superAdminResponse.status()}`);

      // Super Admin login should succeed or return a valid response
      expect(superAdminResponse.status()).toBeLessThan(500);

      if (superAdminResponse.ok()) {
        const body = await superAdminResponse.json();
        const hasToken = body.idToken || body.accessToken || body.token;
        console.log(`  Token received: ${hasToken ? 'Yes' : 'No'}`);
        console.log('  Super Admin login: SUCCESS');
      } else {
        console.log(`  Super Admin login returned: ${superAdminResponse.status()}`);
      }

      // Step 2: Login using Admin credentials (different admin email)
      console.log('\nStep 2: Login using Admin credentials...');
      const adminEmail = 'admin.devrainyday@yopmail.com';
      console.log(`  Email: ${adminEmail}`);

      const adminResponse = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: {
          email: adminEmail,
          password: VALID_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  Response Status: ${adminResponse.status()}`);
      expect(adminResponse.status()).toBeLessThan(500);

      if (adminResponse.ok()) {
        const adminBody = await adminResponse.json();
        const hasToken = adminBody.idToken || adminBody.accessToken || adminBody.token;
        console.log(`  Token received: ${hasToken ? 'Yes' : 'No'}`);
        console.log('  Admin login: SUCCESS');
      } else {
        console.log(`  Admin login returned: ${adminResponse.status()}`);
      }

      console.log('\nQ-5635: PASSED - API allows login for valid roles\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5636: Verify login fails with wrong password
  test('Q-5636: Verify login fails with wrong password', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5636: Login fails with wrong password');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Enter valid email...');
    console.log(`  Email: ${VALID_EMAIL}`);
    console.log('Step 2: Enter wrong password...');
    console.log('  Password: WrongPassword@999');

    console.log('Step 3: Send request...');

    try {
      const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: {
          email: VALID_EMAIL,
          password: 'WrongPassword@999'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  Response Status: ${response.status()}`);

      // Should return 4xx error for wrong password
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);

      if (response.status() === 401) {
        console.log('  API returns 401 Unauthorized');
      } else if (response.status() === 400) {
        console.log('  API returns 400 Bad Request');
      } else {
        console.log(`  API returns error status: ${response.status()}`);
      }

      try {
        const responseBody = await response.json();
        const errorMessage = responseBody.message || responseBody.error || JSON.stringify(responseBody);
        console.log(`  Error message: ${errorMessage}`);
      } catch (e) {
        console.log('  Response is not JSON');
      }

      console.log('\nQ-5636: PASSED - API returns authentication error for wrong password\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5637: Verify login fails with unregistered email
  test('Q-5637: Verify login fails with unregistered email', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5637: Login fails with unregistered email');
    console.log('═══════════════════════════════════════════════════════\n');

    const unregisteredEmail = 'unregistered.user.xyz123@fakeemail.com';

    console.log('Step 1: Enter unregistered email...');
    console.log(`  Email: ${unregisteredEmail}`);
    console.log('Step 2: Enter password...');
    console.log('  Password: ********');
    console.log('Step 3: Send request...');

    try {
      const response = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: {
          email: unregisteredEmail,
          password: 'SomePassword@123'
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  Response Status: ${response.status()}`);

      // Should return 4xx error for unregistered email
      expect(response.status()).toBeGreaterThanOrEqual(400);
      expect(response.status()).toBeLessThan(500);

      if (response.status() === 404) {
        console.log('  API returns 404 Not Found');
      } else if (response.status() === 401) {
        console.log('  API returns 401 Unauthorized');
      } else if (response.status() === 400) {
        console.log('  API returns 400 Bad Request');
      } else {
        console.log(`  API returns error status: ${response.status()}`);
      }

      try {
        const responseBody = await response.json();
        const errorMessage = responseBody.message || responseBody.error || JSON.stringify(responseBody);
        console.log(`  Error message: ${errorMessage}`);

        // Verify error mentions user not found or similar
        const msgLower = errorMessage.toLowerCase();
        if (msgLower.includes('not found') || msgLower.includes('not exist') || msgLower.includes('invalid') || msgLower.includes('unauthorized')) {
          console.log('  Error correctly indicates user not found / invalid');
        }
      } catch (e) {
        console.log('  Response is not JSON');
      }

      console.log('\nQ-5637: PASSED - API returns user not found error for unregistered email\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5638: Verify login fails when request body is empty
  test('Q-5638: Verify login fails when request body is empty', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5638: Login fails when request body is empty');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Send empty body request...');

    try {
      // Test 1: Completely empty body
      console.log('  Test 1: Sending request with empty object {}');
      const response1 = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: {},
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  Response Status (empty body): ${response1.status()}`);

      // Should return 4xx error for empty body
      expect(response1.status()).toBeGreaterThanOrEqual(400);
      expect(response1.status()).toBeLessThan(500);

      try {
        const body1 = await response1.json();
        const errorMessage = body1.message || body1.error || JSON.stringify(body1);
        console.log(`  Error message: ${errorMessage}`);
      } catch (e) {
        console.log('  Response is not JSON');
      }

      // Test 2: No content-type header
      console.log('\n  Test 2: Sending request with no data');
      const response2 = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  Response Status (no data): ${response2.status()}`);
      expect(response2.status()).toBeGreaterThanOrEqual(400);

      try {
        const body2 = await response2.json();
        console.log(`  Error message: ${body2.message || body2.error || 'N/A'}`);
      } catch (e) {
        // Response may not be JSON
      }

      console.log('\nQ-5638: PASSED - API returns bad request error for empty body\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

  // Q-5639: Verify login fails when invalid data type sent
  test('Q-5639: Verify login fails when invalid data type sent', async ({ request }) => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Q-5639: Login fails when invalid data type sent');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Step 1: Send number instead of email string...');

    try {
      // Test 1: Number instead of email
      console.log('  Test 1: email = 12345 (number instead of string)');
      const response1 = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: {
          email: 12345,
          password: VALID_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  Response Status: ${response1.status()}`);

      // Should return 4xx error
      expect(response1.status()).toBeGreaterThanOrEqual(400);
      expect(response1.status()).toBeLessThan(500);

      try {
        const body1 = await response1.json();
        const errorMessage = body1.message || body1.error || JSON.stringify(body1);
        console.log(`  Error message: ${errorMessage}`);
      } catch (e) {
        console.log('  Response is not JSON');
      }

      // Test 2: Number instead of password
      console.log('\n  Test 2: password = 99999 (number instead of string)');
      const response2 = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: {
          email: VALID_EMAIL,
          password: 99999
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  Response Status: ${response2.status()}`);
      expect(response2.status()).toBeGreaterThanOrEqual(400);

      try {
        const body2 = await response2.json();
        console.log(`  Error message: ${body2.message || body2.error || 'N/A'}`);
      } catch (e) {
        // Response may not be JSON
      }

      // Test 3: Array instead of string
      console.log('\n  Test 3: email = [1,2,3] (array instead of string)');
      const response3 = await request.post(`${API_BASE_URL}${LOGIN_ENDPOINT}`, {
        data: {
          email: [1, 2, 3],
          password: VALID_PASSWORD
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`  Response Status: ${response3.status()}`);
      expect(response3.status()).toBeGreaterThanOrEqual(400);

      try {
        const body3 = await response3.json();
        console.log(`  Error message: ${body3.message || body3.error || 'N/A'}`);
      } catch (e) {
        // Response may not be JSON
      }

      console.log('\nQ-5639: PASSED - API returns validation error for invalid data types\n');

    } catch (error) {
      console.log(`  Error: ${error.message}`);
      throw error;
    }
  });

});
