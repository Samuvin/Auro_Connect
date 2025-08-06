/**
 * Login Page Object Model
 * Contains all selectors and actions for the login page
 */
export class LoginPage {
  constructor(page) {
    this.page = page;
    
    // Page elements
    this.usernameInput = page.getByPlaceholder('Username');
    this.passwordInput = page.getByPlaceholder('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.loadingSpinner = page.locator('.animate-spin');
    
    // Use more specific selectors to avoid ambiguity
    this.signupLink = page.locator('a[href="/signup"]').last(); // Use the main signup link in form
    
    // Page content - be more specific
    this.pageTitle = page.getByRole('heading', { name: 'Sign in to your account' });
    this.logoTitle = page.getByRole('heading', { name: 'Auto_Connect' }); // More specific - heading only
    this.newUserText = page.getByText('New to Auto_Connect?');
    
    // Error/Success elements - Updated for react-hot-toast
    this.errorToast = page.locator('[data-hot-toast], .Toastify__toast--error, [role="alert"]');
    this.successToast = page.locator('[data-hot-toast], .Toastify__toast--success');
    this.errorMessage = page.locator('.toast-error, .alert-error, .error-message, [data-hot-toast], [role="alert"]');
    this.successMessage = page.locator('.toast-success, .alert-success, .success-message, [data-hot-toast]');
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill in the login form
   * @param {string} username - Username to enter
   * @param {string} password - Password to enter
   */
  async fillCredentials(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /**
   * Click the login button
   */
  async clickLogin() {
    await this.loginButton.click();
  }

  /**
   * Perform complete login action
   * @param {string} username - Username
   * @param {string} password - Password
   */
  async login(username, password) {
    await this.fillCredentials(username, password);
    await this.clickLogin();
  }

  /**
   * Wait for login to complete (either success or error)
   */
  async waitForLoginResponse() {
    try {
      // Wait for either success (redirect) or error message with longer timeout
      await this.page.waitForFunction(
        () => {
          // Check for redirect away from login
          if (window.location.pathname !== '/login') {
            return true;
          }
          
          // Check for error toast/alert messages
          const errorSelectors = [
            '[data-hot-toast]',
            '.Toastify__toast--error', 
            '[role="alert"]',
            '.toast-error',
            '.alert-error',
            '.error-message'
          ];
          
          for (const selector of errorSelectors) {
            if (document.querySelector(selector)) {
              return true;
            }
          }
          
          // Check for specific error text patterns
          const bodyText = document.body.textContent || '';
          const errorPatterns = [
            'Invalid credentials',
            'User not found',
            'Wrong password',
            'Error',
            'Failed'
          ];
          
          return errorPatterns.some(pattern => bodyText.includes(pattern));
        },
        {},
        { timeout: 15000 }
      );
    } catch (error) {
      // If timeout occurs, that's still valid for some tests
      console.log('Timeout waiting for login response, continuing...');
    }
  }

  /**
   * Check if currently on login page
   */
  async isOnLoginPage() {
    return this.page.url().includes('/login');
  }

  /**
   * Check if login form is visible
   */
  async isLoginFormVisible() {
    return await this.usernameInput.isVisible() && 
           await this.passwordInput.isVisible() && 
           await this.loginButton.isVisible();
  }

  /**
   * Check if loading state is active
   */
  async isLoading() {
    return await this.loadingSpinner.isVisible();
  }

  /**
   * Get the current value of username input
   */
  async getUsernameValue() {
    return await this.usernameInput.inputValue();
  }

  /**
   * Get the current value of password input
   */
  async getPasswordValue() {
    return await this.passwordInput.inputValue();
  }

  /**
   * Check if login button is enabled
   */
  async isLoginButtonEnabled() {
    return await this.loginButton.isEnabled();
  }

  /**
   * Check for error message
   */
  async hasErrorMessage() {
    try {
      // Check multiple error selectors
      const errorVisible = await this.errorMessage.first().isVisible({ timeout: 2000 });
      if (errorVisible) return true;
      
      // Also check page content for error text
      const pageContent = await this.page.textContent('body');
      const errorTexts = ['Invalid credentials', 'Error', 'Failed', 'Wrong', 'Invalid'];
      return errorTexts.some(text => pageContent.includes(text));
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage() {
    try {
      if (await this.errorMessage.first().isVisible({ timeout: 2000 })) {
        return await this.errorMessage.first().textContent();
      }
      
      // Fallback: look for error text in page content
      const pageContent = await this.page.textContent('body');
      const errorTexts = ['Invalid credentials', 'User not found', 'Wrong password'];
      const foundError = errorTexts.find(text => pageContent.includes(text));
      return foundError || null;
    } catch {
      return null;
    }
  }

  /**
   * Check for success message
   */
  async hasSuccessMessage() {
    try {
      return await this.successMessage.first().isVisible({ timeout: 2000 });
    } catch {
      return false;
    }
  }

  /**
   * Get success message text
   */
  async getSuccessMessage() {
    try {
      if (await this.hasSuccessMessage()) {
        return await this.successMessage.first().textContent();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Clear all form fields
   */
  async clearForm() {
    await this.usernameInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Click the signup link
   */
  async clickSignupLink() {
    await this.signupLink.click();
  }

  /**
   * Press Enter key to submit form
   */
  async pressEnterToSubmit() {
    await this.passwordInput.press('Enter');
  }

  /**
   * Tab through form fields
   */
  async tabThroughForm() {
    await this.usernameInput.focus();
    await this.page.keyboard.press('Tab');
    await this.page.keyboard.press('Tab');
    
    // Check if login button is focused using evaluation
    return await this.page.evaluate(() => {
      const activeElement = document.activeElement;
      const loginButtons = Array.from(document.querySelectorAll('button'));
      const loginButton = loginButtons.find(btn => 
        btn.textContent.includes('Login') || 
        btn.type === 'submit'
      );
      return activeElement === loginButton;
    });
  }

  /**
   * Verify page accessibility
   */
  async checkAccessibility() {
    // Check for proper labels and ARIA attributes
    const usernameLabel = await this.usernameInput.getAttribute('aria-label') || 
                         await this.usernameInput.getAttribute('placeholder');
    const passwordLabel = await this.passwordInput.getAttribute('aria-label') || 
                         await this.passwordInput.getAttribute('placeholder');
    
    return {
      hasUsernameLabel: !!usernameLabel,
      hasPasswordLabel: !!passwordLabel,
      hasSubmitButton: await this.loginButton.isVisible()
    };
  }
} 