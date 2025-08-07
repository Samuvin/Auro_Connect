import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Integration Testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './',
  testMatch: '**/*.integration.test.ts',
  fullyParallel: false, // Run integration tests sequentially for database consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // Use single worker for integration tests
  reporter: [
    ['html', { outputFolder: 'integration-report' }],
    ['json', { outputFile: 'integration-results.json' }],
    ['list']
  ],
  
  use: {
    // Global test settings
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Timeouts
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium-integration',
      use: { ...devices['Desktop Chrome'] },
    }
  ],

  // Output directories
  outputDir: 'integration-test-results/',
  
  // Global setup and teardown
  timeout: 60000, // 60 seconds per test
}); 