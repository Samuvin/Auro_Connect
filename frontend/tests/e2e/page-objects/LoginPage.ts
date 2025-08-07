import { Page, Locator, expect } from '@playwright/test';
import { LoginCredentials } from '../types/auth.types.js';

/**
 * Login Page Object Model - TypeScript implementation
 * Contains all selectors and actions for the login page
 */
export class LoginPage {
  readonly page: Page;
  
  // Form elements
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly signupLink: Locator;
  
  // Page content
  readonly pageTitle: Locator;
  readonly logoTitle: Locator;
  readonly newUserText: Locator;
  readonly loadingSpinner: Locator;
  
  // Message elements
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly toastContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Form elements
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    // Use more specific selector for signup link in the main form area
    this.signupLink = page.getByRole('main').getByRole('link', { name: 'Join now' });
    
    // Page content - use more flexible selectors
    this.pageTitle = page.locator('h2').filter({ hasText: /sign in/i });
    this.logoTitle = page.getByRole('heading', { name: 'Auto_Connect' });
    this.newUserText = page.getByText('New to Auto_Connect?');
    this.loadingSpinner = page.locator('.animate-spin, .loading, .spinner');
    
    // Messages
    this.errorMessage = page.locator('[data-hot-toast], .toast-error, .alert-error, [role="alert"]');
    this.successMessage = page.locator('[data-hot-toast], .toast-success, .alert-success');
    this.toastContainer = page.locator('[data-hot-toast], .toast-container');
  }

  /**
   * Navigate to the login page
   */
  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  /**
   * Wait for login page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await expect(this.usernameInput).toBeVisible({ timeout: 10000 });
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /**
   * Fill login credentials
   */
  async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /**
   * Click login button
   */
  async clickLogin(): Promise<void> {
    await this.loginButton.click();
  }

  /**
   * Perform complete login action
   */
  async login(credentials: LoginCredentials): Promise<void> {
    await this.fillCredentials(credentials.username, credentials.password);
    await this.clickLogin();
  }

  /**
   * Submit form using Enter key
   */
  async submitWithEnter(): Promise<void> {
    await this.passwordInput.press('Enter');
  }

  /**
   * Wait for login response/navigation
   */
  async waitForLoginResponse(): Promise<void> {
    try {
      // Wait for either successful navigation or error message with shorter timeout
      await Promise.race([
        this.page.waitForURL('/', { timeout: 5000 }),
        this.errorMessage.waitFor({ state: 'visible', timeout: 5000 }),
        // Also wait for any page change or loading completion
        this.page.waitForLoadState('networkidle', { timeout: 5000 })
      ]);
    } catch (error) {
      // If neither condition is met, still continue the test
      console.warn('Login response timeout, continuing test...');
    }
  }

  /**
   * Clear form fields
   */
  async clearForm(): Promise<void> {
    await this.usernameInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Check if login form is visible
   */
  async isLoginFormVisible(): Promise<boolean> {
    try {
      await expect(this.usernameInput).toBeVisible({ timeout: 5000 });
      await expect(this.passwordInput).toBeVisible({ timeout: 5000 });
      await expect(this.loginButton).toBeVisible({ timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if currently on login page
   */
  async isOnLoginPage(): Promise<boolean> {
    return this.page.url().includes('/login');
  }

  /**
   * Check if error message is displayed
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 3000 });
      return await this.errorMessage.isVisible();
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
   * Check if login button is enabled
   */
  async isLoginButtonEnabled(): Promise<boolean> {
    return await this.loginButton.isEnabled();
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
  async getUsernameValue(): Promise<string> {
    return await this.usernameInput.inputValue();
  }

  async getPasswordValue(): Promise<string> {
    return await this.passwordInput.inputValue();
  }

  /**
   * Navigate to signup page
   */
  async navigateToSignup(): Promise<void> {
    await this.signupLink.click();
    await this.page.waitForURL('/signup');
  }

  /**
   * Test keyboard navigation through form
   */
  async testTabNavigation(): Promise<boolean> {
    await this.usernameInput.focus();
    await this.page.keyboard.press('Tab');
    
    const passwordFocused = await this.passwordInput.evaluate(
      (el) => el === document.activeElement
    );
    
    if (passwordFocused) {
      await this.page.keyboard.press('Tab');
      const buttonFocused = await this.loginButton.evaluate(
        (el) => el === document.activeElement
      );
      return buttonFocused;
    }
    
    return false;
  }

  /**
   * Validate form attributes
   */
  async validateFormAttributes(): Promise<{
    usernameRequired: boolean;
    passwordRequired: boolean;
    passwordTypeCorrect: boolean;
  }> {
    const usernameRequired = await this.usernameInput.getAttribute('required') !== null;
    const passwordRequired = await this.passwordInput.getAttribute('required') !== null;
    const passwordType = await this.passwordInput.getAttribute('type');
    
    return {
      usernameRequired,
      passwordRequired,
      passwordTypeCorrect: passwordType === 'password'
    };
  }
} 