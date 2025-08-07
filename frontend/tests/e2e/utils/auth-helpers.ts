import { Page, BrowserContext } from '@playwright/test';
import type { LoginCredentials, AuthResponse, MockConfig } from '../types/auth.types.js';

/**
 * Authentication helper functions for E2E tests
 */

/**
 * Mock successful login API response
 */
export async function mockSuccessfulLogin(page: Page, credentials: LoginCredentials): Promise<void> {
  await page.route('**/api/auth/login', async (route) => {
    const request = route.request();
    const postData = JSON.parse(request.postData() || '{}');
    
    if (postData.username === credentials.username && postData.password === credentials.password) {
      const response: AuthResponse = {
        success: true,
        message: 'Login successful',
        user: {
          id: 'test-user-123',
          username: credentials.username,
          email: 'test@example.com',
          fullName: 'Test User'
        },
        token: 'mock-jwt-token'
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
        headers: {
          'Set-Cookie': 'auth-token=mock-token; HttpOnly; Path=/'
        }
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Invalid credentials'
        })
      });
    }
  });
}

/**
 * Mock failed login API response
 */
export async function mockFailedLogin(page: Page, config: MockConfig = {}): Promise<void> {
  const { errorMessage = 'Invalid credentials', statusCode = 401, delay = 0 } = config;
  
  await page.route('**/api/auth/login', async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: errorMessage
      })
    });
  });
}

/**
 * Mock signup API response
 */
export async function mockSignupResponse(page: Page, config: MockConfig = {}): Promise<void> {
  const { shouldSucceed = true, errorMessage = 'Registration failed', statusCode, delay = 0 } = config;
  
  await page.route('**/api/auth/signup', async (route) => {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    if (shouldSucceed) {
      const response: AuthResponse = {
        success: true,
        message: 'Registration successful',
        user: {
          id: 'new-user-123',
          username: 'newuser',
          email: 'newuser@example.com',
          fullName: 'New User'
        }
      };
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    } else {
      await route.fulfill({
        status: statusCode || 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: errorMessage
        })
      });
    }
  });
}

/**
 * Mock authentication check endpoint
 */
export async function mockAuthCheck(page: Page, isAuthenticated: boolean = false): Promise<void> {
  await page.route('**/api/auth/me', async (route) => {
    if (isAuthenticated) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'test-user-123',
          username: 'testuser',
          email: 'test@example.com',
          fullName: 'Test User'
        })
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Unauthorized'
        })
      });
    }
  });
}

/**
 * Mock network timeout
 */
export async function mockNetworkTimeout(page: Page, endpoint: string = '**/api/auth/**'): Promise<void> {
  await page.route(endpoint, async (route) => {
    // Simulate network timeout by not responding
    await new Promise(resolve => setTimeout(resolve, 30000));
    await route.abort('failed');
  });
}

/**
 * Mock server error
 */
export async function mockServerError(page: Page, statusCode: number = 500): Promise<void> {
  await page.route('**/api/auth/**', async (route) => {
    await route.fulfill({
      status: statusCode,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message: 'Internal server error'
      })
    });
  });
}

/**
 * Login via API (for setting up authenticated state)
 */
export async function loginViaAPI(page: Page, credentials: LoginCredentials, baseURL: string): Promise<void> {
  const response = await page.request.post(`${baseURL}/api/auth/login`, {
    data: credentials
  });
  
  if (!response.ok()) {
    throw new Error(`Login failed: ${response.status()}`);
  }
  
  // Extract cookies from response and set them in the page
  const cookies = response.headers()['set-cookie'];
  if (cookies) {
    // Parse and set cookies in the browser context
    await page.context().addCookies([
      {
        name: 'auth-token',
        value: 'authenticated',
        domain: new URL(baseURL).hostname,
        path: '/'
      }
    ]);
  }
}

/**
 * Check authentication status
 */
export async function checkAuthStatus(page: Page, baseURL: string): Promise<boolean> {
  try {
    const response = await page.request.get(`${baseURL}/api/auth/me`);
    return response.ok();
  } catch {
    return false;
  }
}

/**
 * Setup authenticated browser context
 */
export async function setupAuthenticatedContext(
  context: BrowserContext, 
  credentials: LoginCredentials, 
  baseURL: string
): Promise<void> {
  const page = await context.newPage();
  await loginViaAPI(page, credentials, baseURL);
  await page.close();
}

/**
 * Clear all authentication-related mocks
 */
export async function clearAuthMocks(page: Page): Promise<void> {
  await page.unroute('**/api/auth/**');
}

/**
 * Setup comprehensive authentication mocking
 */
export async function setupAuthMocking(page: Page, config: {
  loginSuccess?: boolean;
  signupSuccess?: boolean;
  isAuthenticated?: boolean;
  loginDelay?: number;
  signupDelay?: number;
} = {}): Promise<void> {
  const {
    loginSuccess = true,
    signupSuccess = true,
    isAuthenticated = false,
    loginDelay = 0,
    signupDelay = 0
  } = config;
  
  // Mock login endpoint
  if (loginSuccess) {
    await mockSuccessfulLogin(page, { username: 'testuser', password: 'password123' });
  } else {
    await mockFailedLogin(page, { delay: loginDelay });
  }
  
  // Mock signup endpoint
  await mockSignupResponse(page, { 
    shouldSucceed: signupSuccess, 
    delay: signupDelay 
  });
  
  // Mock auth check
  await mockAuthCheck(page, isAuthenticated);
}

/**
 * Wait for authentication state change
 */
export async function waitForAuthStateChange(page: Page, expectedState: 'authenticated' | 'unauthenticated'): Promise<void> {
  const timeout = 10000;
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const isAuth = await checkAuthStatus(page, page.url());
    
    if ((expectedState === 'authenticated' && isAuth) || 
        (expectedState === 'unauthenticated' && !isAuth)) {
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error(`Timeout waiting for auth state: ${expectedState}`);
}

/**
 * Simulate slow network conditions
 */
export async function simulateSlowNetwork(page: Page, delay: number = 2000): Promise<void> {
  await page.route('**/*', async (route) => {
    await new Promise(resolve => setTimeout(resolve, delay));
    await route.continue();
  });
}

/**
 * Mock CSRF token validation
 */
export async function mockCSRFValidation(page: Page, shouldFail: boolean = false): Promise<void> {
  await page.route('**/api/auth/**', async (route) => {
    const request = route.request();
    const csrfToken = request.headers()['x-csrf-token'];
    
    if (shouldFail || !csrfToken) {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'CSRF token validation failed'
        })
      });
    } else {
      await route.continue();
    }
  });
} 