/**
 * Type definitions for authentication E2E tests
 */

export interface TestUser {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupFormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    username: string;
    email: string;
    fullName: string;
  };
  token?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface MockConfig {
  shouldSucceed?: boolean;
  delay?: number;
  errorMessage?: string;
  statusCode?: number;
} 