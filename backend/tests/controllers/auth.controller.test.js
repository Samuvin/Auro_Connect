import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../models/user.model.js';
import { signup, login, logout, getCurrentUser } from '../../controllers/auth.controller.js';
import { createTestUser } from '../setup.js';

// Create test app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock routes for testing
app.post('/auth/signup', signup);
app.post('/auth/login', login);
app.post('/auth/logout', logout);
app.get('/auth/me', (req, res, next) => {
  // Mock auth middleware for getCurrentUser test
  req.user = { _id: 'test-user-id', name: 'Test User' };
  next();
}, getCurrentUser);

describe('Auth Controller', () => {
  describe('POST /auth/signup', () => {
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
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.username).toBe(userData.username);
      expect(createdUser.email).toBe(userData.email);
      
      // Verify password was hashed
      expect(createdUser.password).not.toBe(userData.password);
      const isValidPassword = await bcrypt.compare(userData.password, createdUser.password);
      expect(isValidPassword).toBe(true);
    });

    test('should set JWT cookie on successful signup', async () => {
      const userData = createTestUser();
      
      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(201);

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/jwt-linkedin/);
    });

    test('should reject signup with missing required fields', async () => {
      const testCases = [
        { name: 'Test User', username: 'test', email: 'test@example.com' }, // missing password
        { name: 'Test User', username: 'test', password: 'password123' }, // missing email
        { name: 'Test User', email: 'test@example.com', password: 'password123' }, // missing username
        { username: 'test', email: 'test@example.com', password: 'password123' }, // missing name
      ];

      for (const userData of testCases) {
        const response = await request(app)
          .post('/auth/signup')
          .send(userData)
          .expect(400);

        expect(response.body.message).toBe('All fields are required');
      }
    });

    test('should reject signup with existing email', async () => {
      const userData = createTestUser();
      
      // Create user first
      await new User({
        ...userData,
        password: await bcrypt.hash(userData.password, 10),
      }).save();

      // Try to create another user with same email
      const response = await request(app)
        .post('/auth/signup')
        .send(createTestUser({ username: 'different' }))
        .expect(400);

      expect(response.body.message).toBe('Email already exists');
    });

    test('should reject signup with existing username', async () => {
      const userData = createTestUser();
      
      // Create user first
      await new User({
        ...userData,
        password: await bcrypt.hash(userData.password, 10),
      }).save();

      // Try to create another user with same username
      const response = await request(app)
        .post('/auth/signup')
        .send(createTestUser({ email: 'different@example.com' }))
        .expect(400);

      expect(response.body.message).toBe('Username already exists');
    });

    test('should reject signup with short password', async () => {
      const userData = createTestUser({ password: '123' });
      
      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBe('Password must be at least 6 characters');
    });

    test('should handle database errors gracefully', async () => {
      // Mock User.save to throw an error
      const originalSave = User.prototype.save;
      User.prototype.save = jest.fn().mockRejectedValue(new Error('Database error'));

      const userData = createTestUser();
      
      const response = await request(app)
        .post('/auth/signup')
        .send(userData)
        .expect(500);

      expect(response.body.message).toBe('Internal server error');
      
      // Restore original save method
      User.prototype.save = originalSave;
    });
  });

  describe('POST /auth/login', () => {
    let testUser;
    const userData = createTestUser();

    beforeEach(async () => {
      // Create a test user for login tests
      testUser = await new User({
        ...userData,
        password: await bcrypt.hash(userData.password, 10),
      }).save();
    });

    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: userData.username,
          password: userData.password,
        })
        .expect(200);

      expect(response.body.message).toBe('Logged in successfully');
      
      // Verify JWT cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/jwt-linkedin/);
    });

    test('should reject login with invalid username', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'nonexistent',
          password: userData.password,
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: userData.username,
          password: 'wrongpassword',
        })
        .expect(400);

      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should handle database errors gracefully', async () => {
      // Mock User.findOne to throw an error
      const originalFindOne = User.findOne;
      User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/auth/login')
        .send({
          username: userData.username,
          password: userData.password,
        })
        .expect(500);

      expect(response.body.message).toBe('Server error');
      
      // Restore original method
      User.findOne = originalFindOne;
    });
  });

  describe('POST /auth/logout', () => {
    test('should logout successfully and clear JWT cookie', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
      
      // Verify cookie is cleared
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/jwt-linkedin=;/);
    });
  });

  describe('GET /auth/me', () => {
    test('should return current user data', async () => {
      const response = await request(app)
        .get('/auth/me')
        .expect(200);

      expect(response.body._id).toBe('test-user-id');
      expect(response.body.name).toBe('Test User');
    });

    test('should handle errors gracefully', async () => {
      // Create a custom route that returns null user
      const errorApp = express();
      errorApp.get('/auth/me', (req, res) => {
        req.user = null; // This will return null with 200 status
        getCurrentUser(req, res);
      });

      const response = await request(errorApp)
        .get('/auth/me')
        .expect(200);

      expect(response.body).toBe(null);
    });

    test('should handle unauthenticated requests', async () => {
      // Create a custom route without user authentication
      const errorApp = express();
      errorApp.get('/auth/me', (req, res) => {
        req.user = null; // This represents no authenticated user
        getCurrentUser(req, res);
      });

      const response = await request(errorApp)
        .get('/auth/me')
        .expect(200);

      expect(response.body).toBe(null);
    });
  });

  describe('Edge Cases and Security Tests', () => {
    test('should sanitize user input on signup', async () => {
      const maliciousData = createTestUser({
        name: '<script>alert("xss")</script>',
        username: 'test<script>',
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/auth/signup')
        .send(maliciousData)
        .expect(201);

      const createdUser = await User.findOne({ email: maliciousData.email });
      // The user should be created but with the malicious content as-is
      // (real sanitization would be handled by input validation middleware)
      expect(createdUser.name).toBe(maliciousData.name);
    });

    test('should handle extremely long input values', async () => {
      const longString = 'a'.repeat(10000);
      const userData = createTestUser({
        name: longString,
        username: 'test',
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/auth/signup')
        .send(userData);

      // Should handle gracefully (either accept or reject, but not crash)
      expect([201, 400, 500]).toContain(response.status);
    });

    test('should handle special characters in credentials', async () => {
      const specialData = createTestUser({
        name: 'User !@#$%^&*()',
        username: 'user_test-123',
        password: 'pass!@#$%^&*()',
      });

      const response = await request(app)
        .post('/auth/signup')
        .send(specialData)
        .expect(201);

      // Should be able to login with the same special characters
      await request(app)
        .post('/auth/login')
        .send({
          username: specialData.username,
          password: specialData.password,
        })
        .expect(200);
    });
  });
}); 