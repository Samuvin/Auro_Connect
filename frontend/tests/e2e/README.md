# E2E Testing for Auto_Connect Login

This directory contains comprehensive End-to-End (E2E) tests for the Auto_Connect login functionality using Playwright.

## Overview

The E2E tests cover all aspects of the login process including:

- ✅ **UI Elements & Page Load**: Verify all login page elements are present and accessible
- ✅ **Successful Login**: Test valid credential login and session management
- ✅ **Failed Login Attempts**: Test invalid credentials and error handling
- ✅ **Form Validation**: Test input validation and user interaction
- ✅ **Navigation**: Test links and redirects
- ✅ **Security**: Test against common security vulnerabilities
- ✅ **Responsive Design**: Test on mobile and tablet viewports
- ✅ **Performance**: Test load times and concurrent access
- ✅ **Error Handling**: Test network errors and edge cases

## Test Structure

```
tests/e2e/
├── auth/
│   ├── login.spec.js                    # Main login functionality tests
│   └── login-error-handling.spec.js     # Error handling and edge cases
├── page-objects/
│   └── loginPage.js                     # Login Page Object Model
└── utils/
    ├── test-users.js                    # Test user data and credentials
    └── auth-helpers.js                  # Authentication helper functions
```

## Running the Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npm run playwright:install
   ```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with browser UI visible
npm run test:e2e:headed

# Run tests with Playwright UI mode
npm run test:e2e:ui

# Run only login tests
npm run test:e2e:login

# Debug tests step by step
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run tests for CI/CD
npm run test:e2e:ci
```

### Run Specific Test Files

```bash
# Run main login tests
npx playwright test tests/e2e/auth/login.spec.js

# Run error handling tests
npx playwright test tests/e2e/auth/login-error-handling.spec.js

# Run specific test by name
npx playwright test --grep "should login successfully"
```

## Test Data

### Valid Test Users

The tests use predefined test users that should exist in your test database:

```javascript
{
  username: 'testuser',
  password: 'password123',
  email: 'test@example.com',
  name: 'Test User'
}
```

### Test Environment

- **Base URL**: `https://auro-connect-r9mk.onrender.com`
- **Login URL**: `https://auro-connect-r9mk.onrender.com/login`

## Browser Support

Tests run on multiple browsers:
- ✅ Chromium (Chrome/Edge)
- ✅ Firefox
- ✅ WebKit (Safari)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## Test Scenarios Covered

### 1. Page Load and UI Elements
- Login page loads correctly
- All form elements are present
- Accessibility attributes are correct
- Page title and branding elements

### 2. Successful Login
- Login with valid credentials
- Login using Enter key
- Session persistence after login
- Redirect to home page

### 3. Failed Login Attempts
- Non-existent user
- Wrong password
- Empty username/password
- Multiple failed attempts

### 4. Form Interaction
- Button state changes
- Loading indicators
- Form field clearing
- Tab navigation

### 5. Navigation
- Signup link navigation
- Protected route redirection

### 6. Security Testing
- SQL injection prevention
- XSS attack prevention
- Special character handling
- Long input handling

### 7. Responsive Design
- Mobile viewport testing
- Tablet viewport testing
- Form usability across devices

### 8. Performance
- Page load time testing
- Concurrent login testing

### 9. Error Handling
- Network timeouts
- Server errors (500, 429)
- Network disconnection
- CSRF token validation

## Page Object Model

The tests use the Page Object Model pattern for maintainability:

```javascript
import { LoginPage } from '../page-objects/loginPage.js';

const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login('username', 'password');
```

### Available Methods

- `goto()` - Navigate to login page
- `fillCredentials(username, password)` - Fill form fields
- `login(username, password)` - Complete login action
- `waitForLoginResponse()` - Wait for login completion
- `hasErrorMessage()` - Check for error messages
- `clearForm()` - Clear all form fields

## Configuration

### Playwright Configuration

The main E2E configuration is in `frontend/playwright.config.js`:

```javascript
export default defineConfig({
  testDir: './tests/e2e',
  baseURL: 'https://auro-connect-r9mk.onrender.com',
  retries: process.env.CI ? 2 : 0,
  // ... other settings
});
```

### Timeouts

- **Action Timeout**: 10 seconds
- **Navigation Timeout**: 30 seconds
- **Test Timeout**: 30 seconds

## Best Practices

### 1. Test Isolation
- Each test is independent
- Tests clean up after themselves
- No shared state between tests

### 2. Reliable Selectors
- Use semantic selectors (getByRole, getByPlaceholder)
- Avoid CSS selectors when possible
- Include data-testid for custom elements

### 3. Error Handling
- All async operations are awaited
- Timeouts are configured appropriately
- Tests handle both success and failure cases

### 4. Maintainability
- Page Object Model for reusability
- Utility functions for common operations
- Clear test descriptions and comments

## Troubleshooting

### Common Issues

1. **Test User Not Found**
   ```
   Solution: Ensure test users exist in the database
   ```

2. **Network Timeouts**
   ```
   Solution: Check network connectivity and increase timeout values
   ```

3. **Element Not Found**
   ```
   Solution: Verify selectors match the current UI
   ```

4. **Tests Flaky**
   ```
   Solution: Add proper waits and increase timeouts
   ```

### Debug Mode

Run tests in debug mode to step through:
```bash
npm run test:e2e:debug
```

### Screenshots and Videos

Failed tests automatically capture:
- Screenshots
- Videos
- Traces (for debugging)

View in the test report: `npm run test:e2e:report`

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Use the Page Object Model
3. Add proper error handling
4. Include accessibility checks
5. Test on multiple viewports
6. Document new test scenarios

## Related Documentation

- [Main Testing Documentation](../../../TESTING.md)
- [Playwright Documentation](https://playwright.dev/)
- [Frontend Unit Tests](../../__tests__/)
- [Performance Tests](../../performance/) 