import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.CLIENT_URL = 'http://localhost:3000';

  // Start in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
});

// Test utilities
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

export const mockCloudinary = {
  uploader: {
    upload: jest.fn().mockResolvedValue({
      secure_url: 'https://test-cloudinary-url.com/image.jpg',
      public_id: 'test-image-id',
    }),
    destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
  },
};

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
}); 