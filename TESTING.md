# Testing Documentation

This document provides comprehensive information about the testing setup and methodology for the LinkedIn Clone project.

## Overview

The project includes comprehensive unit and integration tests for both frontend and backend components, following industry best practices for testing Node.js and React applications.

## Backend Testing

### Setup

The backend uses Jest with MongoDB Memory Server for isolated testing:

- **Test Framework**: Jest
- **Database**: MongoDB Memory Server (in-memory database)
- **HTTP Testing**: Supertest
- **Mocking**: Native Jest mocks for external services

### Test Structure

```
backend/
├── tests/
│   ├── setup.js              # Test configuration and utilities
│   ├── controllers/           # Controller unit tests
│   │   ├── auth.controller.test.js
│   │   └── post.controller.test.js
│   ├── models/               # Model validation tests
│   │   └── user.model.test.js
│   └── middleware/           # Middleware tests
│       └── auth.middleware.test.js
```

### Running Backend Tests

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Coverage

Current test coverage includes:

- **Controllers** (100% line coverage target)
  - Authentication (signup, login, logout)
  - Post management (create, read, delete)
  - Error handling and edge cases

- **Models** (100% schema validation)
  - User model validation
  - Data integrity checks
  - Relationship testing

- **Middleware** (100% security scenarios)
  - JWT authentication
  - Route protection
  - Error scenarios

### Backend Test Examples

#### Controller Testing
```javascript
test('should register a new user successfully', async () => {
  const userData = createTestUser();
  
  const response = await request(app)
    .post('/auth/signup')
    .send(userData)
    .expect(201);

  expect(response.body.message).toBe('User registered successfully');
  
  // Verify user was created in database
  const createdUser = await User.findOne({ email: userData.email });
  expect(createdUser).toBeTruthy();
});
```

#### Model Testing
```javascript
test('should enforce unique email constraint', async () => {
  const userData1 = createTestUser();
  const userData2 = createTestUser({
    username: 'different',
    email: userData1.email, // Same email
  });
  
  const user1 = new User(userData1);
  await user1.save();
  
  const user2 = new User(userData2);
  await expect(user2.save()).rejects.toThrow();
});
```

## Frontend Testing

### Setup

The frontend uses Jest with React Testing Library:

- **Test Framework**: Jest
- **React Testing**: React Testing Library
- **User Interactions**: @testing-library/user-event
- **Mocking**: Jest mocks for API calls and external libraries

### Test Structure

```
frontend/src/
├── __tests__/                # App-level tests
│   └── App.test.jsx
├── components/
│   └── __tests__/            # Component unit tests
│       ├── Post.test.jsx
│       ├── PostCreation.test.jsx
│       ├── UserCard.test.jsx
│       └── FriendRequest.test.jsx
└── utils/
    └── testUtils.jsx         # Test utilities
```

### Running Frontend Tests

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Frontend Test Examples

#### Component Testing
```javascript
test('should render post content correctly', () => {
  const TestWrapper = createTestWrapper();
  
  render(
    <TestWrapper>
      <Post post={mockPost} />
    </TestWrapper>
  );

  expect(screen.getByText('Test post content')).toBeInTheDocument();
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

#### User Interaction Testing
```javascript
test('should enable share button when text is entered', async () => {
  const user = userEvent.setup();
  
  render(<PostCreation />, { wrapper: TestWrapper });

  const textarea = screen.getByPlaceholderText(/what's on your mind/i);
  const shareButton = screen.getByRole('button', { name: /share/i });
  
  expect(shareButton).toBeDisabled();
  
  await user.type(textarea, 'This is a test post');
  
  expect(shareButton).toBeEnabled();
});
```

## Test Utilities

### Backend Utilities

```javascript
// tests/setup.js
export const createTestUser = (overrides = {}) => ({
  name: 'Test User',
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  ...overrides,
});

export const createAuthToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};
```

### Frontend Utilities

```javascript
// utils/testUtils.jsx
export const renderWithProviders = (ui, options = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    ),
    ...options,
  });
};
```

## Testing Best Practices

### 1. Test Structure
- **AAA Pattern**: Arrange, Act, Assert
- **Descriptive Names**: Tests should clearly describe what they're testing
- **Single Responsibility**: Each test should verify one specific behavior

### 2. Mocking Strategy
- **External Dependencies**: Always mock external APIs and services
- **Database**: Use in-memory database for backend tests
- **UI Libraries**: Mock heavy UI components for faster tests

### 3. Edge Cases and Error Handling
- **Input Validation**: Test with invalid, missing, and edge-case data
- **Network Errors**: Test API failure scenarios
- **Loading States**: Test UI during async operations

### 4. Security Testing
- **Authentication**: Test unauthorized access attempts
- **Input Sanitization**: Test with malicious input
- **Authorization**: Test permission boundaries

## Code Coverage Goals

- **Backend**: Minimum 90% line coverage
- **Frontend**: Minimum 80% line coverage
- **Critical Paths**: 100% coverage for authentication and data operations

## Continuous Integration

Tests are automatically run on:
- Every pull request
- Every commit to main branch
- Nightly builds for comprehensive testing

## Debugging Tests

### Backend
```bash
# Run specific test file
npm test -- auth.controller.test.js

# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Frontend
```bash
# Run specific test file
npm test -- Post.test.jsx

# Run tests with verbose output
npm test -- --verbose
```

## Writing New Tests

### Backend Controller Test Template
```javascript
describe('Controller Name', () => {
  describe('Method Name', () => {
    test('should handle success case', async () => {
      // Arrange
      const mockData = createTestData();
      
      // Act
      const response = await request(app)
        .post('/endpoint')
        .send(mockData)
        .expect(200);
      
      // Assert
      expect(response.body).toMatchObject(expectedResult);
    });

    test('should handle error case', async () => {
      // Test error scenarios
    });

    test('should validate input', async () => {
      // Test input validation
    });
  });
});
```

### Frontend Component Test Template
```javascript
describe('Component Name', () => {
  describe('Rendering', () => {
    test('should render correctly', () => {
      render(<Component />, { wrapper: TestWrapper });
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should handle click events', async () => {
      const user = userEvent.setup();
      render(<Component />, { wrapper: TestWrapper });
      
      await user.click(screen.getByRole('button'));
      expect(mockFunction).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle edge case', () => {
      // Test edge scenarios
    });
  });
});
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Issues**
   ```bash
   # Clear Jest cache
   npm test -- --clearCache
   ```

2. **React Testing Library Issues**
   ```bash
   # Update testing dependencies
   npm update @testing-library/react @testing-library/jest-dom
   ```

3. **Mock Issues**
   ```javascript
   // Clear all mocks between tests
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

### Performance Tips

1. **Parallel Execution**: Use `--maxWorkers` to control test parallelism
2. **Test Splitting**: Group related tests together
3. **Mock Heavy Operations**: Always mock file uploads, email sending, etc.

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server) 