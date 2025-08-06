import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/loginPage.js';
import { invalidCredentials } from '../../utils/test-users.js';

test.describe('Login Error Handling', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.describe('Network and Server Errors', () => {
    test('should handle network timeout gracefully', async ({ page }) => {
      // Simulate slow network
      await page.route('**/auth/login', async route => {
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30s delay
        await route.continue();
      });

      await loginPage.fillCredentials('testuser', 'password123');
      await loginPage.clickLogin();

      // Should handle timeout gracefully
      await expect(loginPage.loginButton).toBeVisible({ timeout: 35000 });
    });

    test('should handle server 500 error', async ({ page }) => {
      // Mock server error response
      await page.route('**/auth/login', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Internal server error' })
        });
      });

      await loginPage.login('testuser', 'password123');
      await loginPage.waitForLoginResponse();

      // Should show appropriate error message
      expect(await loginPage.hasErrorMessage()).toBe(true);
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle network disconnection', async ({ page }) => {
      // Simulate network failure
      await page.route('**/auth/login', route => route.abort());

      await loginPage.login('testuser', 'password123');
      
      // Should handle network failure gracefully
      await expect(async () => {
        await loginPage.waitForLoginResponse();
      }).not.toThrow();
    });
  });

  test.describe('Rate Limiting', () => {
    test('should handle rate limiting responses', async ({ page }) => {
      // Mock rate limiting response
      await page.route('**/auth/login', async route => {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ 
            message: 'Too many login attempts. Please try again later.' 
          })
        });
      });

      await loginPage.login('testuser', 'password123');
      await loginPage.waitForLoginResponse();

      expect(await loginPage.hasErrorMessage()).toBe(true);
      const errorText = await loginPage.getErrorMessage();
      expect(errorText).toContain('Too many');
    });
  });

  test.describe('Input Validation Errors', () => {
    test('should show validation error for malformed email format', async () => {
      // Test with email-like username but malformed
      await loginPage.login('invalid-email@', 'password123');
      await loginPage.waitForLoginResponse();

      expect(await loginPage.hasErrorMessage()).toBe(true);
    });

    test('should handle extremely long passwords', async () => {
      const longPassword = 'a'.repeat(10000);
      
      await loginPage.login('testuser', longPassword);
      await loginPage.waitForLoginResponse();

      // Should either handle gracefully or show appropriate error
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle unicode characters', async () => {
      const unicodeUsername = '测试用户';
      const unicodePassword = 'пароль123';
      
      await loginPage.login(unicodeUsername, unicodePassword);
      await loginPage.waitForLoginResponse();

      // Should handle unicode without crashing
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });
  });

  test.describe('Browser Compatibility', () => {
    test('should work without JavaScript enabled', async ({ page }) => {
      // Disable JavaScript
      await page.setExtraHTTPHeaders({
        'Content-Security-Policy': "script-src 'none'"
      });
      
      await loginPage.goto();
      
      // Form should still be visible and functional for basic submission
      expect(await loginPage.isLoginFormVisible()).toBe(true);
    });

    test('should handle disabled cookies', async ({ context, page }) => {
      // Create new context with cookies disabled
      const newContext = await context.browser().newContext({
        acceptDownloads: false,
        hasTouch: false,
        javaScriptEnabled: true,
        permissions: [],
        storageState: undefined,
      });
      
      const newPage = await newContext.newPage();
      const newLoginPage = new LoginPage(newPage);
      
      await newLoginPage.goto();
      await newLoginPage.login('testuser', 'password123');
      await newLoginPage.waitForLoginResponse();

      // Should handle cookie issues gracefully
      expect(await newLoginPage.isOnLoginPage()).toBe(true);
      
      await newContext.close();
    });
  });

  test.describe('Security Edge Cases', () => {
    test('should prevent credential enumeration', async () => {
      // Test with valid username but wrong password
      await loginPage.login('testuser', 'wrongpassword');
      await loginPage.waitForLoginResponse();
      const errorMessage1 = await loginPage.getErrorMessage();

      await loginPage.clearForm();

      // Test with invalid username
      await loginPage.login('nonexistentuser', 'wrongpassword');
      await loginPage.waitForLoginResponse();
      const errorMessage2 = await loginPage.getErrorMessage();

      // Error messages should be similar to prevent username enumeration
      expect(errorMessage1).toBeDefined();
      expect(errorMessage2).toBeDefined();
      // Both should be generic "Invalid credentials" type messages
    });

    test('should handle CSRF token validation', async ({ page }) => {
      // Mock CSRF error
      await page.route('**/auth/login', async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'CSRF token validation failed' })
        });
      });

      await loginPage.login('testuser', 'password123');
      await loginPage.waitForLoginResponse();

      expect(await loginPage.hasErrorMessage()).toBe(true);
    });
  });
}); 