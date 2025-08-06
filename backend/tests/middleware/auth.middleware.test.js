import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { protectRoute } from '../../middleware/auth.middleware.js';
import { createTestUser, createAuthToken } from '../setup.js';

// Mock response object
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Mock request object
const mockRequest = (overrides = {}) => ({
  cookies: {},
  user: null,
  ...overrides,
});

describe('Auth Middleware', () => {
  let testUser;

  beforeEach(async () => {
    // Create a test user for authentication tests
    testUser = await new User({
      ...createTestUser(),
      password: 'hashedpassword123',
    }).save();
  });

  describe('protectRoute middleware', () => {
    test('should authenticate valid JWT token', async () => {
      const token = createAuthToken(testUser._id);
      const req = mockRequest({
        cookies: { 'jwt-linkedin': token },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user._id.toString()).toBe(testUser._id.toString());
      expect(req.user.email).toBe(testUser.email);
      expect(req.user.username).toBe(testUser.username);
    });

    test('should reject request without JWT token', async () => {
      const req = mockRequest(); // No token in cookies
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized - No Token Provided' });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeFalsy();
    });

    test('should reject request with invalid JWT token', async () => {
      const req = mockRequest({
        cookies: { 'jwt-linkedin': 'invalid-token' },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeFalsy();
    });

    test('should reject request with expired JWT token', async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { userId: testUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' } // Expired 1 hour ago
      );

      const req = mockRequest({
        cookies: { 'jwt-linkedin': expiredToken },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeFalsy();
    });

    test('should reject request for non-existent user', async () => {
      // Create token with non-existent user ID
      const nonExistentUserId = '60d0fe4f5311236168a109ca';
      const token = createAuthToken(nonExistentUserId);

      const req = mockRequest({
        cookies: { 'jwt-linkedin': token },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeFalsy();
    });

    test('should handle JWT with wrong secret', async () => {
      // Create token with different secret
      const wrongToken = jwt.sign(
        { userId: testUser._id },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        cookies: { 'jwt-linkedin': wrongToken },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeFalsy();
    });

    test('should handle malformed JWT token', async () => {
      const req = mockRequest({
        cookies: { 'jwt-linkedin': 'malformed.jwt.token' },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeFalsy();
    });

    test.skip('should handle database errors gracefully', async () => {
      const token = createAuthToken(testUser._id);
      
      // Suppress console.error during this test
      const originalConsoleError = console.error;
      console.error = jest.fn();
      
      // Mock User.findById to throw an error
      const originalFindById = User.findById;
      User.findById = jest.fn().mockRejectedValue(new Error('Database connection error'));

      const req = mockRequest({
        cookies: { 'jwt-linkedin': token },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
      expect(req.user).toBeFalsy();

      // Restore original methods
      User.findById = originalFindById;
      console.error = originalConsoleError;
    });

    test('should exclude password from user object', async () => {
      const token = createAuthToken(testUser._id);
      const req = mockRequest({
        cookies: { 'jwt-linkedin': token },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.password).toBeUndefined();
    });

    test('should handle JWT without userId', async () => {
      const tokenWithoutUserId = jwt.sign(
        { someOtherField: 'value' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        cookies: { 'jwt-linkedin': tokenWithoutUserId },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle empty cookie value', async () => {
      const req = mockRequest({
        cookies: { 'jwt-linkedin': '' },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized - No Token Provided' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle null/undefined cookies', async () => {
      const req = mockRequest({ cookies: null });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle request without cookies property', async () => {
      const req = { user: null }; // No cookies property
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should validate token payload structure', async () => {
      // Token with invalid payload structure
      const invalidPayloadToken = jwt.sign(
        { invalidField: 'invalid-payload-string' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const req = mockRequest({
        cookies: { 'jwt-linkedin': invalidPayloadToken },
      });
      const res = mockResponse();
      const next = jest.fn();

      await protectRoute(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect([
        'Unauthorized - Invalid Token',
        'User not found'
      ]).toContain(res.json.mock.calls[0][0].message);
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 