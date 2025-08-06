/**
 * Test user data for E2E testing
 * Note: For production testing, these users should exist in the database
 * For reliable testing, consider using API mocking (see mockLoginAPI function)
 */

export const testUsers = {
  validUser: {
    username: 'testuser123',
    password: 'password123',
    email: 'test@example.com',
    name: 'Test User'
  },
  
  adminUser: {
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    name: 'Admin User'
  },
  
  // User with special characters for testing edge cases
  specialUser: {
    username: 'test.user_2024',
    password: 'Test@Pass123!',
    email: 'test.user@example.com',
    name: 'Test User Special'
  }
};

export const invalidCredentials = {
  nonExistentUser: {
    username: 'nonexistent_user_12345',
    password: 'wrongpassword'
  },
  
  wrongPassword: {
    username: 'testuser123',
    password: 'wrongpassword123'
  },
  
  emptyUsername: {
    username: '',
    password: 'password123'
  },
  
  emptyPassword: {
    username: 'testuser123',
    password: ''
  },
  
  shortPassword: {
    username: 'testuser123',
    password: '123'
  }
};

/**
 * Mock successful login API response
 * @param {Object} page - Playwright page object
 * @param {Object} credentials - User credentials
 */
export async function mockSuccessfulLogin(page, credentials) {
  await page.route('**/api/auth/login', async route => {
    const request = route.request();
    const postData = JSON.parse(request.postData() || '{}');
    
    // Check if credentials match our test user
    if (postData.username === credentials.username && postData.password === credentials.password) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          message: 'Logged in successfully',
          user: {
            id: '123',
            username: credentials.username,
            name: credentials.name || 'Test User'
          }
        }),
        headers: {
          'Set-Cookie': 'jwt-linkedin=mock-token; HttpOnly; Path=/'
        }
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' })
      });
    }
  });
}

/**
 * Mock failed login API response
 * @param {Object} page - Playwright page object
 * @param {string} errorMessage - Error message to return
 */
export async function mockFailedLogin(page, errorMessage = 'Invalid credentials') {
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: errorMessage })
    });
  });
}

/**
 * Mock authentication check endpoint
 * @param {Object} page - Playwright page object
 * @param {boolean} isAuthenticated - Whether user should appear authenticated
 */
export async function mockAuthCheck(page, isAuthenticated = false) {
  await page.route('**/api/auth/me', async route => {
    if (isAuthenticated) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          username: 'testuser123',
          name: 'Test User',
          email: 'test@example.com'
        })
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' })
      });
    }
  });
}

/**
 * Setup complete login flow mocking
 * @param {Object} page - Playwright page object
 * @param {Object} options - Configuration options
 */
export async function setupLoginMocking(page, options = {}) {
  const {
    shouldSucceed = true,
    validCredentials = testUsers.validUser,
    errorMessage = 'Invalid credentials'
  } = options;

  // Mock login endpoint
  await page.route('**/api/auth/login', async route => {
    const request = route.request();
    const postData = JSON.parse(request.postData() || '{}');
    
    if (shouldSucceed && 
        postData.username === validCredentials.username && 
        postData.password === validCredentials.password) {
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Logged in successfully' }),
        headers: {
          'Set-Cookie': 'jwt-linkedin=mock-token; HttpOnly; Path=/'
        }
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: errorMessage })
      });
    }
  });

  // Mock auth check endpoint
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: shouldSucceed ? 200 : 401,
      contentType: 'application/json',
      body: JSON.stringify(
        shouldSucceed 
          ? { id: '123', username: validCredentials.username, name: validCredentials.name }
          : { message: 'Unauthorized' }
      )
    });
  });
}

/**
 * Clear all route mocks
 * @param {Object} page - Playwright page object
 */
export async function clearMocks(page) {
  await page.unroute('**/api/auth/login');
  await page.unroute('**/api/auth/me');
  await page.unroute('**/api/auth/logout');
}

/**
 * Creates a test user via API (for actual backend testing)
 * @param {Object} userData - User data to create
 * @param {string} baseURL - Base URL for API calls
 */
export async function createTestUser(userData, baseURL) {
  const response = await fetch(`${baseURL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  
  return response;
}

/**
 * Cleans up test user via API
 * @param {string} username - Username to delete
 * @param {string} baseURL - Base URL for API calls
 */
export async function cleanupTestUser(username, baseURL) {
  // Note: This would require a cleanup endpoint in the backend
  // For now, this is a placeholder for future implementation
  console.log(`Cleanup user: ${username} (placeholder)`);
} 