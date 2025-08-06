import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/loginPage.js';
import { testUsers, setupLoginMocking, clearMocks } from '../../utils/test-users.js';

test.describe('Login Functionality - Reliable Tests', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test.afterEach(async ({ page }) => {
    await clearMocks(page);
  });

  test.describe('Page Load and UI Elements', () => {
    test('should load login page correctly', async ({ page }) => {
      await loginPage.goto();
      
      // Verify form elements are present
      expect(await loginPage.isLoginFormVisible()).toBe(true);
      
      // Verify page title is present (more flexible check)
      await expect(page.locator('h2')).toContainText('Sign in');
      
      // Verify signup link is present
      await expect(page.locator('a[href="/signup"]')).toBeVisible();
    });

    test('should have proper form validation attributes', async ({ page }) => {
      await loginPage.goto();
      
      // Check that required fields are marked as required
      await expect(loginPage.usernameInput).toHaveAttribute('required');
      await expect(loginPage.passwordInput).toHaveAttribute('required');
      
      // Check input types
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('should have accessible form elements', async ({ page }) => {
      await loginPage.goto();
      
      const accessibility = await loginPage.checkAccessibility();
      
      expect(accessibility.hasUsernameLabel).toBe(true);
      expect(accessibility.hasPasswordLabel).toBe(true);
      expect(accessibility.hasSubmitButton).toBe(true);
    });
  });

  test.describe('Successful Login - Mocked', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      // Setup successful login mock
      await setupLoginMocking(page, { 
        shouldSucceed: true,
        validCredentials: testUsers.validUser
      });
      
      await loginPage.goto();
      
      // Perform login
      await loginPage.login(testUsers.validUser.username, testUsers.validUser.password);
      
      // Wait for navigation to complete
      await page.waitForURL('**/');
      
      // Verify successful redirect to home page
      expect(page.url()).toContain('/');
      expect(page.url()).not.toContain('/login');
    });

    test('should login successfully using Enter key', async ({ page }) => {
      await setupLoginMocking(page, { 
        shouldSucceed: true,
        validCredentials: testUsers.validUser
      });
      
      await loginPage.goto();
      
      // Fill credentials
      await loginPage.fillCredentials(testUsers.validUser.username, testUsers.validUser.password);
      
      // Submit using Enter key
      await loginPage.pressEnterToSubmit();
      
      // Wait for navigation
      await page.waitForURL('**/');
      expect(page.url()).not.toContain('/login');
    });
  });

  test.describe('Failed Login Attempts - Mocked', () => {
    test('should show error for invalid credentials', async ({ page }) => {
      // Setup failed login mock
      await setupLoginMocking(page, { 
        shouldSucceed: false,
        errorMessage: 'Invalid credentials'
      });
      
      await loginPage.goto();
      
      await loginPage.login('invalid_user', 'wrong_password');
      
      // Wait a moment for any error messages to appear
      await page.waitForTimeout(1000);
      
      // Should stay on login page
      expect(await loginPage.isOnLoginPage()).toBe(true);
      
      // Check for error message (either in toast or page content)
      const hasError = await loginPage.hasErrorMessage();
      expect(hasError).toBe(true);
    });

    test('should handle empty username', async ({ page }) => {
      await loginPage.goto();
      
      await loginPage.fillCredentials('', 'password123');
      await loginPage.clickLogin();
      
      // Form should not submit due to HTML5 validation
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle empty password', async ({ page }) => {
      await loginPage.goto();
      
      await loginPage.fillCredentials('username', '');
      await loginPage.clickLogin();
      
      // Form should not submit due to HTML5 validation
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });
  });

  test.describe('Form Interaction', () => {
    test('should enable login button when form is filled', async ({ page }) => {
      await loginPage.goto();
      
      // Fill form
      await loginPage.fillCredentials('testuser', 'password');
      
      // Button should be enabled
      expect(await loginPage.isLoginButtonEnabled()).toBe(true);
    });

    test('should clear form fields', async ({ page }) => {
      await loginPage.goto();
      
      // Fill form
      await loginPage.fillCredentials('testdata', 'testpassword');
      
      // Verify fields are filled
      expect(await loginPage.getUsernameValue()).toBe('testdata');
      expect(await loginPage.getPasswordValue()).toBe('testpassword');
      
      // Clear form
      await loginPage.clearForm();
      
      // Verify fields are empty
      expect(await loginPage.getUsernameValue()).toBe('');
      expect(await loginPage.getPasswordValue()).toBe('');
    });

    test('should handle tab navigation', async ({ page }) => {
      await loginPage.goto();
      
      // Test tab navigation through form
      const canTabToButton = await loginPage.tabThroughForm();
      expect(canTabToButton).toBe(true);
    });
  });

  test.describe('Navigation and Links', () => {
    test('should navigate to signup page', async ({ page }) => {
      await loginPage.goto();
      
      await loginPage.clickSignupLink();
      
      // Should navigate to signup page
      await expect(page).toHaveURL(/.*\/signup/);
    });

    test('should redirect to login when accessing protected route', async ({ page }) => {
      // Mock unauthenticated state
      await setupLoginMocking(page, { shouldSucceed: false });
      
      // Try to access a protected route directly
      await page.goto('/profile/someuser');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*\/login/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginPage.goto();
      
      // Verify form is still accessible
      expect(await loginPage.isLoginFormVisible()).toBe(true);
      
      // Test basic interaction
      await loginPage.fillCredentials('testuser', 'password');
      expect(await loginPage.getUsernameValue()).toBe('testuser');
    });

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await loginPage.goto();
      expect(await loginPage.isLoginFormVisible()).toBe(true);
    });
  });

  test.describe('Performance', () => {
    test('should load login page within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await loginPage.goto();
      await expect(page.locator('h2')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 10 seconds (more generous for CI)
      expect(loadTime).toBeLessThan(10000);
    });
  });

  test.describe('Security Testing - Basic', () => {
    test('should handle long input values', async ({ page }) => {
      await loginPage.goto();
      
      const longString = 'a'.repeat(100); // Shorter for basic test
      
      await loginPage.fillCredentials(longString, longString);
      await loginPage.clickLogin();
      
      // Should handle gracefully without crashing
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle special characters', async ({ page }) => {
      await loginPage.goto();
      
      const specialChars = 'test@user.com';
      const specialPassword = 'Pass@123!';
      
      await loginPage.fillCredentials(specialChars, specialPassword);
      
      // Should accept special characters
      expect(await loginPage.getUsernameValue()).toBe(specialChars);
      expect(await loginPage.getPasswordValue()).toBe(specialPassword);
    });
  });
}); 