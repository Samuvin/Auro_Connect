import { Page, Locator, expect } from '@playwright/test';
import { SignupFormData } from '../types/auth.types.js';

/**
 * Signup Page Object Model - TypeScript implementation
 * Contains all selectors and actions for the signup page
 */
export class SignupPage {
  readonly page: Page;
  
  // Form elements
  readonly fullNameInput: Locator;
  readonly usernameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signupButton: Locator;
  readonly loginLink: Locator;
  
  // Page content
  readonly pageTitle: Locator;
  readonly logoTitle: Locator;
  readonly existingUserText: Locator;
  readonly loadingSpinner: Locator;
  
  // Message elements
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly toastContainer: Locator;
  readonly validationErrors: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form elements
    this.fullNameInput = page.getByPlaceholder('Full name');
    this.usernameInput = page.getByPlaceholder('Username');
    this.emailInput = page.getByPlaceholder('Email');
    this.passwordInput = page.getByPlaceholder('Password (6+ characters)');
    // Updated to match actual button text
    this.signupButton = page.getByRole('button', { name: 'Agree & Join' });
    // More specific selector to target the form area "Sign in" link, not the navbar
    this.loginLink = page.locator('div.mt-6').getByRole('link', { name: 'Sign in' });
    
    // Page content - updated to match actual page
    this.pageTitle = page.getByRole('heading', { name: 'Make the most of your professional life' });
    this.logoTitle = page.getByRole('heading', { name: 'Auto_Connect' });
    this.existingUserText = page.getByText('Already on LinkedIn?');
    this.loadingSpinner = page.locator('.animate-spin, .loading, .spinner');
    
    // Messages - Updated selectors for react-hot-toast
    this.errorMessage = page.locator('[role="alert"], [data-testid="toast"], .toast, div[role="status"]').filter({ hasText: /error|fail|invalid|wrong/i });
    this.successMessage = page.locator('[role="alert"], [data-testid="toast"], .toast, div[role="status"]').filter({ hasText: /success|created|welcome/i });
    this.toastContainer = page.locator('[role="alert"], [data-testid="toast"], .toast, div[role="status"]');
    this.validationErrors = page.locator('.field-error, .validation-error, .error-text, [aria-invalid="true"] + *, [role="alert"]');
  }

  /**
   * Navigate to the signup page
   */
  async goto(): Promise<void> {
    await this.page.goto('/signup');
    await this.waitForPageLoad();
  }

  /**
   * Wait for signup page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.fullNameInput).toBeVisible({ timeout: 10000 });
    await expect(this.usernameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.signupButton).toBeVisible();
  }

  /**
   * Fill signup form with provided data
   */
  async fillForm(formData: SignupFormData): Promise<void> {
    await this.fullNameInput.fill(formData.fullName);
    await this.usernameInput.fill(formData.username);
    await this.emailInput.fill(formData.email);
    await this.passwordInput.fill(formData.password);
  }

  /**
   * Fill individual form fields
   */
  async fillFullName(name: string): Promise<void> {
    await this.fullNameInput.fill(name);
  }

  async fillUsername(username: string): Promise<void> {
    await this.usernameInput.fill(username);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Click signup button
   */
  async clickSignup(): Promise<void> {
    await this.signupButton.click();
  }

  /**
   * Perform complete signup action
   */
  async signup(formData: SignupFormData): Promise<void> {
    await this.fillForm(formData);
    await this.clickSignup();
  }

  /**
   * Submit form using Enter key
   */
  async submitWithEnter(): Promise<void> {
    await this.passwordInput.press('Enter');
  }

  /**
   * Wait for signup response/navigation
   */
  async waitForSignupResponse(): Promise<void> {
    try {
      // Wait for either successful navigation, error message, or stay on page
      await Promise.race([
        this.page.waitForURL('/', { timeout: 10000 }),
        this.page.waitForURL('/login', { timeout: 10000 }),
        this.errorMessage.waitFor({ state: 'visible', timeout: 10000 })
      ]);
    } catch (error) {
      console.warn('Signup response timeout, continuing test...');
    }
  }

  /**
   * Clear all form fields
   */
  async clearForm(): Promise<void> {
    await this.fullNameInput.clear();
    await this.usernameInput.clear();
    await this.emailInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Check if signup form is visible
   */
  async isSignupFormVisible(): Promise<boolean> {
    try {
      await expect(this.fullNameInput).toBeVisible({ timeout: 5000 });
      await expect(this.usernameInput).toBeVisible({ timeout: 5000 });
      await expect(this.emailInput).toBeVisible({ timeout: 5000 });
      await expect(this.passwordInput).toBeVisible({ timeout: 5000 });
      await expect(this.signupButton).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if currently on signup page
   */
  async isOnSignupPage(): Promise<boolean> {
    return this.page.url().includes('/signup');
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      // Try multiple approaches to find error messages
      const selectors = [
        '[role="alert"]',
        '[data-testid="toast"]',
        '.toast',
        'div[role="status"]'
      ];
      
      for (const selector of selectors) {
        const elements = this.page.locator(selector);
        const count = await elements.count();
        
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i);
          const text = await element.textContent();
          if (text && /error|fail|invalid|wrong|denied|rejected/i.test(text)) {
            return true;
          }
        }
      }
      
      // Also check if any element contains error-related text
      const errorTexts = await this.page.locator('body').filter({ hasText: /error|fail|invalid|wrong|denied|rejected/i }).count();
      return errorTexts > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
    return await this.errorMessage.textContent() || '';
  }

  /**
   * Check if success message is displayed
   */
  async hasSuccessMessage(): Promise<boolean> {
    try {
      await this.successMessage.waitFor({ state: 'visible', timeout: 3000 });
      return await this.successMessage.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Check if signup button is enabled
   */
  async isSignupButtonEnabled(): Promise<boolean> {
    return await this.signupButton.isEnabled();
  }

  /**
   * Check if loading state is shown
   */
  async isLoading(): Promise<boolean> {
    try {
      return await this.loadingSpinner.isVisible({ timeout: 1000 });
    } catch {
      return false;
    }
  }

  /**
   * Get current input values
   */
  async getFormValues(): Promise<SignupFormData> {
    return {
      fullName: await this.fullNameInput.inputValue(),
      username: await this.usernameInput.inputValue(),
      email: await this.emailInput.inputValue(),
      password: await this.passwordInput.inputValue()
    };
  }

  /**
   * Navigate to login page
   */
  async navigateToLogin(): Promise<void> {
    await this.loginLink.click();
    await this.page.waitForURL('/login');
  }

  /**
   * Test keyboard navigation through form
   */
  async testTabNavigation(): Promise<boolean> {
    await this.fullNameInput.focus();
    
    const fields = [this.usernameInput, this.emailInput, this.passwordInput, this.signupButton];
    
    for (const field of fields) {
      await this.page.keyboard.press('Tab');
      const isFocused = await field.evaluate((el) => el === document.activeElement);
      if (!isFocused) return false;
    }
    
    return true;
  }

  /**
   * Validate form input attributes
   */
  async validateFormAttributes(): Promise<{
    fullNameRequired: boolean;
    usernameRequired: boolean;
    emailRequired: boolean;
    emailTypeCorrect: boolean;
    passwordRequired: boolean;
    passwordTypeCorrect: boolean;
  }> {
    const fullNameRequired = await this.fullNameInput.getAttribute('required') !== null;
    const usernameRequired = await this.usernameInput.getAttribute('required') !== null;
    const emailRequired = await this.emailInput.getAttribute('required') !== null;
    const emailType = await this.emailInput.getAttribute('type');
    const passwordRequired = await this.passwordInput.getAttribute('required') !== null;
    const passwordType = await this.passwordInput.getAttribute('type');
    
    return {
      fullNameRequired,
      usernameRequired,
      emailRequired,
      emailTypeCorrect: emailType === 'email',
      passwordRequired,
      passwordTypeCorrect: passwordType === 'password'
    };
  }

  /**
   * Check for validation errors on specific fields
   */
  async getFieldValidationError(fieldName: string): Promise<string | null> {
    const fieldSelector = `[data-field="${fieldName}"] .error, .${fieldName}-error, [aria-describedby*="${fieldName}"]`;
    const errorElement = this.page.locator(fieldSelector);
    
    try {
      await errorElement.waitFor({ state: 'visible', timeout: 2000 });
      return await errorElement.textContent();
    } catch {
      return null;
    }
  }

  /**
   * Check if form has any validation errors
   */
  async hasValidationErrors(): Promise<boolean> {
    try {
      return await this.validationErrors.count() > 0;
    } catch {
      return false;
    }
  }
} 