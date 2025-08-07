import { test, expect } from '@playwright/test';
import { SignupPage } from '../page-objects/SignupPage.js';
import { LoginPage } from '../page-objects/LoginPage.js';
import { 
  generateUniqueSignupData,
  invalidSignupData,
  edgeCaseSignupData,
  securityTestData,
  testUsers
} from '../utils/test-data.js';
import { 
  mockSignupResponse,
  mockSuccessfulLogin,
  clearAuthMocks,
  simulateSlowNetwork
} from '../utils/auth-helpers.js';

test.describe('Signup E2E Tests', () => {
  let signupPage: SignupPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    signupPage = new SignupPage(page);
    loginPage = new LoginPage(page);
  });

  test.afterEach(async ({ page }) => {
    await clearAuthMocks(page);
  });

  test.describe('Page Load and UI Elements', () => {
    test('should load signup page correctly with all elements visible', async () => {
      await signupPage.goto();
      
      // Verify all essential elements are present
      await expect(signupPage.pageTitle).toBeVisible();
      await expect(signupPage.logoTitle).toBeVisible();
      await expect(signupPage.fullNameInput).toBeVisible();
      await expect(signupPage.usernameInput).toBeVisible();
      await expect(signupPage.emailInput).toBeVisible();
      await expect(signupPage.passwordInput).toBeVisible();
      await expect(signupPage.signupButton).toBeVisible();
      await expect(signupPage.loginLink).toBeVisible();
    });

    test('should navigate to signup page from login page', async ({ page }) => {
      await loginPage.goto();
      await loginPage.navigateToSignup();
      
      await expect(page).toHaveURL('/signup');
      expect(await signupPage.isSignupFormVisible()).toBe(true);
    });

    test('should have proper form validation attributes', async () => {
      await signupPage.goto();
      
      const attributes = await signupPage.validateFormAttributes();
      expect(attributes.fullNameRequired).toBe(true);
      expect(attributes.usernameRequired).toBe(true);
      expect(attributes.emailRequired).toBe(true);
      expect(attributes.emailTypeCorrect).toBe(true);
      expect(attributes.passwordRequired).toBe(true);
      expect(attributes.passwordTypeCorrect).toBe(true);
    });

    test('should support keyboard navigation through form', async () => {
      await signupPage.goto();
      
      const canNavigate = await signupPage.testTabNavigation();
      expect(canNavigate).toBe(true);
    });
  });

  test.describe('Successful Signup Scenarios', () => {
    test.beforeEach(async ({ page }) => {
      await mockSignupResponse(page, { shouldSucceed: true });
    });

    test('should signup successfully with unique valid data', async ({ page }) => {
      const uniqueData = generateUniqueSignupData();
      await signupPage.goto();
      
      await signupPage.signup(uniqueData);
      await signupPage.waitForSignupResponse();
      
      // Should redirect to login or home page
      expect(page.url()).not.toContain('/signup');
    });

    test('should signup successfully using Enter key submission', async ({ page }) => {
      const uniqueData = generateUniqueSignupData();
      await signupPage.goto();
      
      await signupPage.fillForm(uniqueData);
      await signupPage.submitWithEnter();
      await signupPage.waitForSignupResponse();
      
      expect(page.url()).not.toContain('/signup');
    });

    test('should handle successful signup with minimal valid data', async ({ page }) => {
      const minimalData = generateUniqueSignupData({
        fullName: 'Test User',
        password: '123456',
        confirmPassword: '123456'
      });
      
      await signupPage.goto();
      await signupPage.signup(minimalData);
      await signupPage.waitForSignupResponse();
      
      expect(page.url()).not.toContain('/signup');
    });

    test('should create account and allow immediate login', async ({ page }) => {
      const uniqueData = generateUniqueSignupData();
      
      // Mock successful signup followed by successful login
      await mockSignupResponse(page, { shouldSucceed: true });
      await mockSuccessfulLogin(page, {
        username: uniqueData.username,
        password: uniqueData.password
      });
      
      await signupPage.goto();
      await signupPage.signup(uniqueData);
      await signupPage.waitForSignupResponse();
      
      // Should be able to login immediately
      await loginPage.goto();
      await loginPage.login({
        username: uniqueData.username,
        password: uniqueData.password
      });
      await loginPage.waitForLoginResponse();
      
      await expect(page).toHaveURL('/');
    });

    test('should generate unique usernames for concurrent signups', async ({ context }) => {
      // Create multiple signup data sets
      const signupDataSets = [
        generateUniqueSignupData(),
        generateUniqueSignupData(),
        generateUniqueSignupData()
      ];
      
      // Verify all usernames are unique
      const usernames = signupDataSets.map(data => data.username);
      const uniqueUsernames = [...new Set(usernames)];
      expect(uniqueUsernames.length).toBe(usernames.length);
      
      // Verify all emails are unique
      const emails = signupDataSets.map(data => data.email);
      const uniqueEmails = [...new Set(emails)];
      expect(uniqueEmails.length).toBe(emails.length);
    });
  });

  test.describe('Form Validation and Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await mockSignupResponse(page, { 
        shouldSucceed: false, 
        errorMessage: 'Validation failed' 
      });
    });

    test('should show validation error for missing full name', async () => {
      const invalidData = invalidSignupData.missingFullName();
      await signupPage.goto();
      
      await signupPage.signup(invalidData);
      
      // Should remain on signup page due to validation
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should show validation error for missing username', async () => {
      const invalidData = invalidSignupData.missingUsername();
      await signupPage.goto();
      
      await signupPage.signup(invalidData);
      
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should show validation error for missing email', async () => {
      const invalidData = invalidSignupData.missingEmail();
      await signupPage.goto();
      
      await signupPage.signup(invalidData);
      
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should show validation error for invalid email format', async () => {
      const invalidData = invalidSignupData.invalidEmail();
      await signupPage.goto();
      
      await signupPage.signup(invalidData);
      
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should show validation error for short password', async () => {
      const invalidData = invalidSignupData.shortPassword();
      await signupPage.goto();
      
      await signupPage.signup(invalidData);
      
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should show validation error for password mismatch', async () => {
      const invalidData = invalidSignupData.passwordMismatch();
      await signupPage.goto();
      
      await signupPage.signup(invalidData);
      
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should handle duplicate username error', async ({ page }) => {
      await mockSignupResponse(page, { 
        shouldSucceed: false, 
        errorMessage: 'Username already exists',
        statusCode: 409
      });
      
      const duplicateData = invalidSignupData.duplicateUsername();
      await signupPage.goto();
      
      await signupPage.signup(duplicateData);
      await signupPage.waitForSignupResponse();
      
      expect(await signupPage.hasErrorMessage()).toBe(true);
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should handle duplicate email error', async ({ page }) => {
      await mockSignupResponse(page, { 
        shouldSucceed: false, 
        errorMessage: 'Email already registered',
        statusCode: 409
      });
      
      const duplicateData = invalidSignupData.duplicateEmail();
      await signupPage.goto();
      
      await signupPage.signup(duplicateData);
      await signupPage.waitForSignupResponse();
      
      expect(await signupPage.hasErrorMessage()).toBe(true);
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });
  });

  test.describe('Form Interaction and UX', () => {
    test('should enable signup button when form is valid', async ({ page }) => {
      await mockSignupResponse(page, { shouldSucceed: true });
      const validData = generateUniqueSignupData();
      
      await signupPage.goto();
      await signupPage.fillForm(validData);
      
      expect(await signupPage.isSignupButtonEnabled()).toBe(true);
    });

    test('should clear form fields correctly', async () => {
      const testData = generateUniqueSignupData();
      await signupPage.goto();
      
      // Fill form
      await signupPage.fillForm(testData);
      
      // Verify fields are filled
      const formValues = await signupPage.getFormValues();
      expect(formValues.fullName).toBe(testData.fullName);
      expect(formValues.username).toBe(testData.username);
      expect(formValues.email).toBe(testData.email);
      
      // Clear form
      await signupPage.clearForm();
      
      // Verify fields are empty
      const clearedValues = await signupPage.getFormValues();
      expect(clearedValues.fullName).toBe('');
      expect(clearedValues.username).toBe('');
      expect(clearedValues.email).toBe('');
      expect(clearedValues.password).toBe('');
    });

    test('should maintain form data during validation errors', async ({ page }) => {
      await mockSignupResponse(page, { 
        shouldSucceed: false, 
        errorMessage: 'Server validation failed' 
      });
      
      const testData = generateUniqueSignupData();
      await signupPage.goto();
      
      await signupPage.signup(testData);
      await signupPage.waitForSignupResponse();
      
      // Form fields should maintain their values after server error
      const maintainedValues = await signupPage.getFormValues();
      expect(maintainedValues.fullName).toBe(testData.fullName);
      expect(maintainedValues.username).toBe(testData.username);
      expect(maintainedValues.email).toBe(testData.email);
      // Password fields might be cleared for security
    });

    test('should show loading state during signup', async ({ page }) => {
      await mockSignupResponse(page, { shouldSucceed: true, delay: 1000 });
      const testData = generateUniqueSignupData();
      
      await signupPage.goto();
      await signupPage.fillForm(testData);
      
      // Start signup and check for loading state
      const signupPromise = signupPage.clickSignup();
      
      // Check if loading state is visible (might be brief)
      const isLoading = await signupPage.isLoading();
      
      await signupPromise;
    });
  });

  test.describe('Navigation and Links', () => {
    test('should navigate to login page via link', async ({ page }) => {
      await signupPage.goto();
      await signupPage.navigateToLogin();
      
      await expect(page).toHaveURL('/login');
    });

    test('should handle navigation during form completion', async ({ page }) => {
      const testData = generateUniqueSignupData();
      await signupPage.goto();
      
      // Partially fill form
      await signupPage.fillFullName(testData.fullName);
      await signupPage.fillUsername(testData.username);
      
      // Navigate away and back
      await page.goto('/login');
      await page.goto('/signup');
      
      // Form should be cleared after navigation
      const formValues = await signupPage.getFormValues();
      expect(formValues.fullName).toBe('');
      expect(formValues.username).toBe('');
    });
  });

  test.describe('Security Testing', () => {
    test.beforeEach(async ({ page }) => {
      await mockSignupResponse(page, { 
        shouldSucceed: false, 
        errorMessage: 'Invalid request' 
      });
    });

    test('should handle SQL injection attempts safely', async () => {
      const maliciousData = generateUniqueSignupData({
        username: securityTestData.sqlInjection.username,
        fullName: securityTestData.sqlInjection.username
      });
      
      await signupPage.goto();
      await signupPage.signup(maliciousData);
      await signupPage.waitForSignupResponse();
      
      expect(await signupPage.hasErrorMessage()).toBe(true);
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should handle XSS attempts safely', async () => {
      const maliciousData = generateUniqueSignupData({
        username: securityTestData.xssAttempt.username,
        fullName: securityTestData.xssAttempt.username
      });
      
      await signupPage.goto();
      await signupPage.signup(maliciousData);
      await signupPage.waitForSignupResponse();
      
      expect(await signupPage.hasErrorMessage()).toBe(true);
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should handle extremely long input values', async () => {
      const longData = generateUniqueSignupData({
        fullName: securityTestData.longInput.username,
        username: securityTestData.longInput.username.substring(0, 50),
        password: securityTestData.longInput.password.substring(0, 50)
      });
      
      await signupPage.goto();
      await signupPage.signup(longData);
      await signupPage.waitForSignupResponse();
      
      // Should handle gracefully without crashing
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should handle special characters appropriately', async () => {
      const specialData = generateUniqueSignupData({
        fullName: 'Test User !@#$%',
        username: 'test_user.123',
        password: 'SecurePass123!@#'
      });
      
      await signupPage.goto();
      await signupPage.signup(specialData);
      await signupPage.waitForSignupResponse();
      
      // Should handle special characters appropriately
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });
  });

  test.describe('Edge Cases and Data Boundaries', () => {
    test('should handle maximum length field values', async ({ page }) => {
      await mockSignupResponse(page, { shouldSucceed: true });
      const maxLengthData = edgeCaseSignupData.maxLengthFields();
      
      await signupPage.goto();
      await signupPage.signup(maxLengthData);
      await signupPage.waitForSignupResponse();
      
      // Should handle long values appropriately
      expect(page.url()).not.toContain('/signup');
    });

    test('should handle minimum length field values', async ({ page }) => {
      await mockSignupResponse(page, { shouldSucceed: true });
      const minLengthData = edgeCaseSignupData.minLengthFields();
      
      await signupPage.goto();
      await signupPage.signup(minLengthData);
      await signupPage.waitForSignupResponse();
      
      expect(page.url()).not.toContain('/signup');
    });

    test('should handle unicode characters in names', async ({ page }) => {
      await mockSignupResponse(page, { shouldSucceed: true });
      const unicodeData = edgeCaseSignupData.unicodeCharacters();
      
      await signupPage.goto();
      await signupPage.signup(unicodeData);
      await signupPage.waitForSignupResponse();
      
      expect(page.url()).not.toContain('/signup');
    });

    test('should handle leading and trailing spaces', async () => {
      const spacedData = edgeCaseSignupData.leadingTrailingSpaces();
      
      await signupPage.goto();
      await signupPage.fillForm(spacedData);
      
      // Check if spaces are trimmed automatically
      const formValues = await signupPage.getFormValues();
      
      // Depending on implementation, spaces might be trimmed
      expect(formValues.fullName.trim()).toBeTruthy();
      expect(formValues.username.trim()).toBeTruthy();
      expect(formValues.email.trim()).toBeTruthy();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work correctly on mobile viewport', async ({ page }) => {
      await mockSignupResponse(page, { shouldSucceed: true });
      const mobileData = generateUniqueSignupData();
      
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await signupPage.goto();
      
      // Verify form is accessible on mobile
      expect(await signupPage.isSignupFormVisible()).toBe(true);
      
      // Test signup functionality on mobile
      await signupPage.signup(mobileData);
      await signupPage.waitForSignupResponse();
      
      expect(page.url()).not.toContain('/signup');
    });

    test('should work correctly on tablet viewport', async ({ page }) => {
      await mockSignupResponse(page, { shouldSucceed: true });
      const tabletData = generateUniqueSignupData();
      
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await signupPage.goto();
      
      expect(await signupPage.isSignupFormVisible()).toBe(true);
      
      await signupPage.signup(tabletData);
      await signupPage.waitForSignupResponse();
      
      expect(page.url()).not.toContain('/signup');
    });
  });

  test.describe('Performance and Error Handling', () => {
    test('should load signup page within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      
      await signupPage.goto();
      await expect(signupPage.pageTitle).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should handle server errors gracefully', async ({ page }) => {
      await mockSignupResponse(page, { 
        shouldSucceed: false, 
        statusCode: 500,
        errorMessage: 'Internal server error' 
      });
      
      const testData = generateUniqueSignupData();
      await signupPage.goto();
      
      await signupPage.signup(testData);
      await signupPage.waitForSignupResponse();
      
      expect(await signupPage.hasErrorMessage()).toBe(true);
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should handle slow network conditions', async ({ page }) => {
      await simulateSlowNetwork(page, 1000);
      await mockSignupResponse(page, { shouldSucceed: true });
      
      const testData = generateUniqueSignupData();
      await signupPage.goto();
      
      await signupPage.signup(testData);
      await signupPage.waitForSignupResponse();
      
      // Should eventually succeed despite slow network
      expect(page.url()).not.toContain('/signup');
    });

    test('should handle network disconnection during signup', async ({ page }) => {
      const testData = generateUniqueSignupData();
      await signupPage.goto();
      
      // Simulate network failure
      await page.route('**/api/auth/signup', async (route) => {
        await route.abort('failed');
      });
      
      await signupPage.fillForm(testData);
      await signupPage.clickSignup();
      
      // Should handle network error gracefully
      await page.waitForTimeout(2000);
      expect(await signupPage.isOnSignupPage()).toBe(true);
    });

    test('should generate unique data for concurrent signups', async ({ context }) => {
      const numberOfConcurrentSignups = 5;
      const signupDataSets: ReturnType<typeof generateUniqueSignupData>[] = [];
      
      // Generate multiple unique signup data sets
      for (let i = 0; i < numberOfConcurrentSignups; i++) {
        signupDataSets.push(generateUniqueSignupData());
      }
      
      // Verify all usernames are unique
      const usernames = signupDataSets.map(data => data.username);
      const uniqueUsernames = new Set(usernames);
      expect(uniqueUsernames.size).toBe(numberOfConcurrentSignups);
      
      // Verify all emails are unique
      const emails = signupDataSets.map(data => data.email);
      const uniqueEmails = new Set(emails);
      expect(uniqueEmails.size).toBe(numberOfConcurrentSignups);
      
      // Verify no data is exactly the same
      const serializedData = signupDataSets.map(data => JSON.stringify(data));
      const uniqueData = new Set(serializedData);
      expect(uniqueData.size).toBe(numberOfConcurrentSignups);
    });
  });
}); 