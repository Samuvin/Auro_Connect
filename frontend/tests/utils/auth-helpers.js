/**
 * Authentication helpers for E2E testing
 */

/**
 * Login via API to get auth cookies
 * @param {Object} page - Playwright page object
 * @param {Object} credentials - User credentials
 * @param {string} baseURL - Base URL for API calls
 */
export async function loginViaAPI(page, credentials, baseURL) {
  const response = await page.request.post(`${baseURL}/api/auth/login`, {
    data: {
      username: credentials.username,
      password: credentials.password
    }
  });
  
  return response;
}

/**
 * Logout via API
 * @param {Object} page - Playwright page object
 * @param {string} baseURL - Base URL for API calls
 */
export async function logoutViaAPI(page, baseURL) {
  const response = await page.request.post(`${baseURL}/api/auth/logout`);
  return response;
}

/**
 * Check if user is authenticated
 * @param {Object} page - Playwright page object
 * @param {string} baseURL - Base URL for API calls
 */
export async function checkAuthStatus(page, baseURL) {
  try {
    const response = await page.request.get(`${baseURL}/api/auth/me`);
    return response.ok();
  } catch (error) {
    return false;
  }
}

/**
 * Setup authenticated context for tests
 * @param {Object} context - Playwright context
 * @param {Object} credentials - User credentials
 * @param {string} baseURL - Base URL
 */
export async function setupAuthenticatedContext(context, credentials, baseURL) {
  const page = await context.newPage();
  await loginViaAPI(page, credentials, baseURL);
  await page.close();
}

/**
 * Wait for authentication state change
 * @param {Object} page - Playwright page object
 * @param {boolean} shouldBeAuthenticated - Expected auth state
 */
export async function waitForAuthState(page, shouldBeAuthenticated = true) {
  await page.waitForFunction(
    (expected) => {
      // Check for auth indicators in the DOM
      const hasAuthElements = document.querySelector('[data-testid="user-menu"], .logout-btn, .user-avatar') !== null;
      const hasLoginForm = document.querySelector('input[placeholder="Username"]') !== null;
      
      if (expected) {
        return hasAuthElements && !hasLoginForm;
      } else {
        return !hasAuthElements || hasLoginForm;
      }
    },
    shouldBeAuthenticated,
    { timeout: 10000 }
  );
} 