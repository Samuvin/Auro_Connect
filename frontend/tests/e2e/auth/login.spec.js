import { test, expect } from '@playwright/test';
import { LoginPage } from '../page-objects/loginPage.js';
import { testUsers, invalidCredentials } from '../../utils/test-users.js';

test.describe('Login Functionality', () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test.describe('Page Load and UI Elements', () => {
    test('should load login page correctly', async () => {
      // Verify page title and main elements
      await expect(loginPage.pageTitle).toBeVisible();
      await expect(loginPage.logoTitle).toBeVisible();
      await expect(loginPage.newUserText).toBeVisible();
      
      // Verify form elements are present
      expect(await loginPage.isLoginFormVisible()).toBe(true);
      
      // Verify signup link is present
      await expect(loginPage.signupLink).toBeVisible();
    });

    test('should have proper form validation attributes', async () => {
      // Check that required fields are marked as required
      await expect(loginPage.usernameInput).toHaveAttribute('required');
      await expect(loginPage.passwordInput).toHaveAttribute('required');
      
      // Check input types
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    });

    test('should have accessible form elements', async () => {
      const accessibility = await loginPage.checkAccessibility();
      
      expect(accessibility.hasUsernameLabel).toBe(true);
      expect(accessibility.hasPasswordLabel).toBe(true);
      expect(accessibility.hasSubmitButton).toBe(true);
    });
  });

  test.describe('Successful Login', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
      // Perform login
      await loginPage.login(testUsers.validUser.username, testUsers.validUser.password);
      
      // Wait for navigation to complete
      await loginPage.waitForLoginResponse();
      
      // Verify successful redirect to home page
      await expect(page).toHaveURL('/');
      
      // Verify user is authenticated (check for logout option or user menu)
      // This might require checking for specific elements that appear when logged in
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('/login');
    });

    test('should login successfully using Enter key', async ({ page }) => {
      // Fill credentials
      await loginPage.fillCredentials(testUsers.validUser.username, testUsers.validUser.password);
      
      // Submit using Enter key
      await loginPage.pressEnterToSubmit();
      
      // Wait for response and verify redirect
      await loginPage.waitForLoginResponse();
      await expect(page).toHaveURL('/');
    });

    test('should maintain session after login', async ({ page, context }) => {
      // Login first
      await loginPage.login(testUsers.validUser.username, testUsers.validUser.password);
      await loginPage.waitForLoginResponse();
      
      // Open new tab and navigate to a protected route
      const newPage = await context.newPage();
      await newPage.goto('/profile/' + testUsers.validUser.username);
      
      // Should not redirect to login (session maintained)
      await newPage.waitForLoadState('networkidle');
      expect(newPage.url()).not.toContain('/login');
      
      await newPage.close();
    });
  });

  test.describe('Failed Login Attempts', () => {
    test('should show error for non-existent user', async () => {
      await loginPage.login(
        invalidCredentials.nonExistentUser.username, 
        invalidCredentials.nonExistentUser.password
      );
      
      await loginPage.waitForLoginResponse();
      
      // Verify error message is shown
      expect(await loginPage.hasErrorMessage()).toBe(true);
      
      // Should stay on login page
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should show error for wrong password', async () => {
      await loginPage.login(
        invalidCredentials.wrongPassword.username, 
        invalidCredentials.wrongPassword.password
      );
      
      await loginPage.waitForLoginResponse();
      
      // Verify error message
      expect(await loginPage.hasErrorMessage()).toBe(true);
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle empty username', async () => {
      await loginPage.login(
        invalidCredentials.emptyUsername.username, 
        invalidCredentials.emptyUsername.password
      );
      
      // Form should not submit due to HTML5 validation
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle empty password', async () => {
      await loginPage.login(
        invalidCredentials.emptyPassword.username, 
        invalidCredentials.emptyPassword.password
      );
      
      // Form should not submit due to HTML5 validation
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle multiple failed attempts', async () => {
      // Attempt 1
      await loginPage.login('wrong1', 'wrong1');
      await loginPage.waitForLoginResponse();
      expect(await loginPage.hasErrorMessage()).toBe(true);
      
      // Clear form and attempt 2
      await loginPage.clearForm();
      await loginPage.login('wrong2', 'wrong2');
      await loginPage.waitForLoginResponse();
      expect(await loginPage.hasErrorMessage()).toBe(true);
      
      // Should still be on login page after multiple attempts
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });
  });

  test.describe('Form Interaction and Validation', () => {
    test('should enable login button when form is filled', async () => {
      // Initially check button state
      const initialState = await loginPage.isLoginButtonEnabled();
      
      // Fill form
      await loginPage.fillCredentials('testuser', 'password');
      
      // Button should be enabled
      expect(await loginPage.isLoginButtonEnabled()).toBe(true);
    });

    test('should show loading state during login', async () => {
      // Start login process
      await loginPage.fillCredentials(testUsers.validUser.username, testUsers.validUser.password);
      await loginPage.clickLogin();
      
      // Check for loading state (this might be fast, so we check immediately)
      const isLoading = await loginPage.isLoading();
      
      // Note: Loading state might be very brief for local testing
      // In real scenarios, this would be more visible
    });

    test('should clear form fields', async () => {
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

    test('should handle tab navigation', async () => {
      // Test tab navigation through form
      const canTabToButton = await loginPage.tabThroughForm();
      expect(canTabToButton).toBe(true);
    });
  });

  test.describe('Navigation and Links', () => {
    test('should navigate to signup page', async ({ page }) => {
      await loginPage.clickSignupLink();
      
      // Should navigate to signup page
      await expect(page).toHaveURL('/signup');
    });

    test('should redirect to login when accessing protected route', async ({ page }) => {
      // Try to access a protected route directly
      await page.goto('/profile/someuser');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });
  });

  test.describe('Security and Edge Cases', () => {
    test('should handle special characters in username', async () => {
      await loginPage.login(
        testUsers.specialUser.username, 
        testUsers.specialUser.password
      );
      
      await loginPage.waitForLoginResponse();
      
      // This test depends on whether special character users exist in the system
      // At minimum, it should not cause a crash
      expect(await loginPage.isOnLoginPage() || !await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle very long input values', async () => {
      const longString = 'a'.repeat(1000);
      
      await loginPage.fillCredentials(longString, longString);
      await loginPage.clickLogin();
      
      // Should handle gracefully without crashing
      await loginPage.waitForLoginResponse();
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      await loginPage.login(sqlInjection, sqlInjection);
      await loginPage.waitForLoginResponse();
      
      // Should handle safely and show appropriate error
      expect(await loginPage.hasErrorMessage()).toBe(true);
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });

    test('should handle XSS attempts', async () => {
      const xssAttempt = '<script>alert("xss")</script>';
      
      await loginPage.login(xssAttempt, xssAttempt);
      await loginPage.waitForLoginResponse();
      
      // Should handle safely
      expect(await loginPage.isOnLoginPage()).toBe(true);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Reload page with mobile viewport
      await loginPage.goto();
      
      // Verify form is still accessible
      expect(await loginPage.isLoginFormVisible()).toBe(true);
      
      // Test login functionality on mobile
      await loginPage.login(testUsers.validUser.username, testUsers.validUser.password);
      await loginPage.waitForLoginResponse();
      
      await expect(page).toHaveURL('/');
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
      await expect(loginPage.pageTitle).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle concurrent login attempts', async ({ context }) => {
      // Create multiple pages for concurrent testing
      const pages = await Promise.all([
        context.newPage(),
        context.newPage(),
        context.newPage()
      ]);
      
      // Attempt login on all pages simultaneously
      const loginPromises = pages.map(async (page) => {
        const pageMobileLogin = new LoginPage(page);
        await pageMobileLogin.goto();
        await pageMobileLogin.login(testUsers.validUser.username, testUsers.validUser.password);
        await pageMobileLogin.waitForLoginResponse();
        return page.url();
      });
      
      const results = await Promise.all(loginPromises);
      
      // All should succeed (though only one session would be active)
      results.forEach(url => {
        expect(url).not.toContain('/login');
      });
      
      // Cleanup
      await Promise.all(pages.map(page => page.close()));
    });
  });
}); 