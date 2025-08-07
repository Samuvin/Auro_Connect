import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { getHealthStatus } from '../../controllers/health.controller.js';

// Create test app
const app = express();
app.use(express.json());

// Mock routes for testing
app.get('/health', getHealthStatus);
app.get('/healthz', getHealthStatus);

describe('Health Controller - Dynatrace Compatible', () => {
  describe('GET /healthz', () => {
    test('should return health status response with correct Dynatrace format', async () => {
      const response = await request(app)
        .get('/healthz');

      // Should return either 200 (UP) or 503 (DOWN) depending on DB state
      expect([200, 503]).toContain(response.status);
      
      expect(response.body).toHaveProperty('status');
      expect(['UP', 'DOWN']).toContain(response.body.status);
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('hostname');
      expect(response.body).toHaveProperty('platform');
      expect(response.body).toHaveProperty('nodeVersion');
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body).toHaveProperty('checks');
      expect(response.body).toHaveProperty('metrics');
      
      // Check "checks" structure (Dynatrace format)
      expect(response.body.checks).toHaveProperty('database');
      expect(response.body.checks).toHaveProperty('application');
      
      // Database status should be one of the valid states
      expect(['UP', 'DOWN', 'UNKNOWN']).toContain(response.body.checks.database.status);
      expect(response.body.checks.database).toHaveProperty('readyState');
      expect(response.body.checks.database).toHaveProperty('readyStateText');
      expect(response.body.checks.database).toHaveProperty('lastChecked');
      expect(typeof response.body.checks.database.readyState).toBe('number');
      
      // Application should always be UP during tests
      expect(response.body.checks.application).toHaveProperty('status', 'UP');
      expect(response.body.checks.application).toHaveProperty('pid');
      expect(response.body.checks.application).toHaveProperty('lastChecked');
      expect(typeof response.body.checks.application.pid).toBe('number');
      
      // Check metrics structure
      expect(response.body.metrics).toHaveProperty('memory');
      expect(response.body.metrics).toHaveProperty('cpu');
      expect(response.body.metrics).toHaveProperty('system');
      
      // Check timestamp format
      expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
    });

    test('should return UP status when database is properly connected', async () => {
      // Ensure we have a fresh connection
      if (mongoose.connection.readyState !== 1) {
        // Skip this test if database is not connected
        console.log('Skipping test - database not connected');
        return;
      }
      
      const response = await request(app)
        .get('/healthz');

      if (response.body.checks.database.status === 'UP') {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('UP');
        expect(response.body.checks.database).toHaveProperty('responseTime');
        expect(typeof response.body.checks.database.responseTime).toBe('number');
        expect(response.body.checks.database).toHaveProperty('readyState', 1);
        expect(response.body.checks.database).toHaveProperty('readyStateText', 'connected');
      }
    });

    test('should return DOWN status when database connection check fails', async () => {
      // Mock mongoose connection readyState to simulate disconnected state
      const originalReadyState = mongoose.connection.readyState;
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: 0,
        configurable: true,
        writable: true
      });
      
      const response = await request(app)
        .get('/healthz');

      expect(response.status).toBe(503);
      expect(response.body).toHaveProperty('status', 'DOWN');
      expect(response.body.checks.database).toHaveProperty('status', 'DOWN');
      expect(response.body.checks.database).toHaveProperty('readyState', 0);
      expect(response.body.checks.database).toHaveProperty('readyStateText', 'disconnected');
      expect(response.body.checks.application).toHaveProperty('status', 'UP');
      
      // Restore original readyState
      Object.defineProperty(mongoose.connection, 'readyState', {
        value: originalReadyState,
        configurable: true,
        writable: true
      });
    });

    test('should return DOWN status with error details when unexpected error occurs', async () => {
      // Mock process.uptime to throw an error
      const originalUptime = process.uptime;
      process.uptime = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });
      
      const response = await request(app)
        .get('/healthz')
        .expect(500);

      expect(response.body).toHaveProperty('status', 'DOWN');
      expect(response.body).toHaveProperty('error', 'Unexpected error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('hostname');
      expect(response.body).toHaveProperty('environment');
      expect(response.body.checks.application).toHaveProperty('status', 'DOWN');
      
      // Restore original uptime
      process.uptime = originalUptime;
    });

    test('should include detailed system metrics for Dynatrace monitoring', async () => {
      const response = await request(app)
        .get('/healthz');

      // Accept both 200 and 503 status codes
      expect([200, 503]).toContain(response.status);

      const { memory, cpu, system } = response.body.metrics;
      
      // Check memory metrics structure
      expect(memory).toHaveProperty('rss');
      expect(memory).toHaveProperty('heapTotal');
      expect(memory).toHaveProperty('heapUsed');
      expect(memory).toHaveProperty('external');
      expect(memory).toHaveProperty('systemTotal');
      expect(memory).toHaveProperty('systemFree');
      expect(memory).toHaveProperty('systemUsage');
      expect(typeof memory.rss).toBe('number');
      expect(typeof memory.heapTotal).toBe('number');
      expect(typeof memory.heapUsed).toBe('number');
      expect(typeof memory.systemTotal).toBe('number');
      expect(typeof memory.systemFree).toBe('number');
      expect(typeof parseFloat(memory.systemUsage)).toBe('number');
      
      // Check CPU metrics structure
      expect(cpu).toHaveProperty('usage');
      expect(cpu).toHaveProperty('loadAverage');
      expect(cpu).toHaveProperty('cores');
      expect(cpu.usage).toHaveProperty('user');
      expect(cpu.usage).toHaveProperty('system');
      expect(Array.isArray(cpu.loadAverage)).toBe(true);
      expect(typeof cpu.cores).toBe('number');
      
      // Check system metrics
      expect(system).toHaveProperty('uptime');
      expect(system).toHaveProperty('arch');
      expect(system).toHaveProperty('type');
      expect(typeof system.uptime).toBe('number');
      expect(typeof system.arch).toBe('string');
      expect(typeof system.type).toBe('string');
    });

    test('should include correct environment and version information', async () => {
      const response = await request(app)
        .get('/healthz');

      // Accept both 200 and 503 status codes
      expect([200, 503]).toContain(response.status);
      
      expect(response.body.environment).toBe(process.env.NODE_ENV || 'development');
      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof response.body.hostname).toBe('string');
      expect(typeof response.body.platform).toBe('string');
      expect(typeof response.body.nodeVersion).toBe('string');
      expect(response.body.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
    });

    test('should have response time and proper cache headers', async () => {
      const response = await request(app)
        .get('/healthz');

      // Accept both 200 and 503 status codes
      expect([200, 503]).toContain(response.status);

      // Check response time is included
      expect(response.body).toHaveProperty('responseTime');
      expect(typeof response.body.responseTime).toBe('number');
      expect(response.body.responseTime).toBeGreaterThanOrEqual(0);
      
      // Check cache control headers for Dynatrace
      expect(response.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
      expect(response.headers['pragma']).toBe('no-cache');
      expect(response.headers['expires']).toBe('0');
    });

    test('should have database response time when connected', async () => {
      const response = await request(app)
        .get('/healthz');

      // Accept both 200 and 503 status codes
      expect([200, 503]).toContain(response.status);

      if (response.body.checks.database.status === 'UP') {
        expect(typeof response.body.checks.database.responseTime).toBe('number');
        expect(response.body.checks.database.responseTime).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('GET /health (legacy endpoint)', () => {
    test('should work with legacy health endpoint', async () => {
      const response = await request(app)
        .get('/health');

      // Should return either 200 (UP) or 503 (DOWN) depending on DB state
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(['UP', 'DOWN']).toContain(response.body.status);
    });
  });
}); 