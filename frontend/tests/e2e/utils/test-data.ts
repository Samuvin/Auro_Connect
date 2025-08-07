import { nanoid } from 'nanoid';
import type { TestUser, LoginCredentials, SignupFormData, MockConfig } from '../types/auth.types.js';

/**
 * Generate unique test data for E2E tests
 */

/**
 * Generate a unique username
 */
export function generateUniqueUsername(prefix: string = 'testuser'): string {
  return `${prefix}_${nanoid(8)}`;
}

/**
 * Generate a unique email
 */
export function generateUniqueEmail(domain: string = 'example.com'): string {
  return `test_${nanoid(8)}@${domain}`;
}

/**
 * Generate a unique full name
 */
export function generateUniqueFullName(): string {
  const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const suffix = nanoid(4);
  
  return `${firstName} ${lastName} ${suffix}`;
}

/**
 * Generate complete signup form data with unique values
 */
export function generateUniqueSignupData(overrides: Partial<SignupFormData> = {}): SignupFormData {
  const uniqueId = nanoid(8);
  
  return {
    fullName: generateUniqueFullName(),
    username: generateUniqueUsername(),
    email: generateUniqueEmail(),
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    ...overrides
  };
}

/**
 * Generate login credentials
 */
export function generateLoginCredentials(overrides: Partial<LoginCredentials> = {}): LoginCredentials {
  return {
    username: generateUniqueUsername(),
    password: 'TestPassword123!',
    ...overrides
  };
}

/**
 * Pre-defined test users for consistent testing
 */
export const testUsers = {
  valid: {
    username: 'testuser123',
    password: 'password123',
    email: 'test@example.com',
    fullName: 'Test User'
  } as TestUser,
  
  admin: {
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    fullName: 'Admin User'
  } as TestUser,
  
  specialChars: {
    username: 'test.user_2024',
    password: 'Test@Pass123!',
    email: 'test.user@example.com',
    fullName: 'Test User Special'
  } as TestUser
};

/**
 * Invalid credentials for negative testing
 */
export const invalidCredentials = {
  nonExistent: {
    username: 'nonexistentuser999',
    password: 'wrongpassword123'
  },
  
  wrongPassword: {
    username: testUsers.valid.username,
    password: 'wrongpassword123'
  },
  
  emptyUsername: {
    username: '',
    password: 'password123'
  },
  
  emptyPassword: {
    username: 'testuser',
    password: ''
  },
  
  bothEmpty: {
    username: '',
    password: ''
  }
};

/**
 * Invalid signup data for testing validation
 */
export const invalidSignupData = {
  missingFullName: (): SignupFormData => ({
    ...generateUniqueSignupData(),
    fullName: ''
  }),
  
  missingUsername: (): SignupFormData => ({
    ...generateUniqueSignupData(),
    username: ''
  }),
  
  missingEmail: (): SignupFormData => ({
    ...generateUniqueSignupData(),
    email: ''
  }),
  
  invalidEmail: (): SignupFormData => ({
    ...generateUniqueSignupData(),
    email: 'invalid-email'
  }),
  
  shortPassword: (): SignupFormData => ({
    ...generateUniqueSignupData(),
    password: '123',
    confirmPassword: '123'
  }),
  
  passwordMismatch: (): SignupFormData => {
    const data = generateUniqueSignupData();
    return {
      ...data,
      confirmPassword: 'different_password'
    };
  },
  
  duplicateUsername: (): SignupFormData => ({
    ...generateUniqueSignupData(),
    username: testUsers.valid.username
  }),
  
  duplicateEmail: (): SignupFormData => ({
    ...generateUniqueSignupData(),
    email: testUsers.valid.email
  })
};

/**
 * Security test data
 */
export const securityTestData = {
  sqlInjection: {
    username: "'; DROP TABLE users; --",
    password: "'; DROP TABLE users; --"
  },
  
  xssAttempt: {
    username: '<script>alert("xss")</script>',
    password: '<script>alert("xss")</script>'
  },
  
  longInput: {
    username: 'a'.repeat(1000),
    password: 'b'.repeat(1000)
  },
  
  specialCharacters: {
    username: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    password: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }
};

/**
 * Edge case signup data
 */
export const edgeCaseSignupData = {
  maxLengthFields: (): SignupFormData => ({
    fullName: 'A'.repeat(100),
    username: 'u'.repeat(50),
    email: `${'e'.repeat(50)}@${'d'.repeat(50)}.com`,
    password: 'P'.repeat(50) + '123!',
    confirmPassword: 'P'.repeat(50) + '123!'
  }),
  
  minLengthFields: (): SignupFormData => ({
    fullName: 'A B',
    username: 'u1',
    email: 'a@b.co',
    password: '123456',
    confirmPassword: '123456'
  }),
  
  unicodeCharacters: (): SignupFormData => ({
    fullName: '测试用户 Тест 🚀',
    username: generateUniqueUsername('тест'),
    email: generateUniqueEmail('тест.com'),
    password: 'Пароль123!',
    confirmPassword: 'Пароль123!'
  }),
  
  leadingTrailingSpaces: (): SignupFormData => ({
    fullName: '  John Doe  ',
    username: `  ${generateUniqueUsername()}  `,
    email: `  ${generateUniqueEmail()}  `,
    password: '  password123  ',
    confirmPassword: '  password123  '
  })
};

/**
 * Mock configuration helpers
 */
export const mockConfigs = {
  successfulLogin: (): MockConfig => ({
    shouldSucceed: true,
    delay: 100
  }),
  
  failedLogin: (message: string = 'Invalid credentials'): MockConfig => ({
    shouldSucceed: false,
    errorMessage: message,
    statusCode: 401,
    delay: 100
  }),
  
  serverError: (): MockConfig => ({
    shouldSucceed: false,
    errorMessage: 'Internal server error',
    statusCode: 500,
    delay: 100
  }),
  
  slowResponse: (): MockConfig => ({
    shouldSucceed: true,
    delay: 3000
  }),
  
  networkTimeout: (): MockConfig => ({
    shouldSucceed: false,
    errorMessage: 'Request timeout',
    statusCode: 408,
    delay: 30000
  })
};

/**
 * Generate test data for performance testing
 */
export function generateBulkSignupData(count: number): SignupFormData[] {
  return Array.from({ length: count }, () => generateUniqueSignupData());
}

/**
 * Generate test data for concurrent login testing
 */
export function generateBulkLoginData(count: number): LoginCredentials[] {
  return Array.from({ length: count }, () => generateLoginCredentials());
} 