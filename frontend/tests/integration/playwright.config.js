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
  retries: process.env.CI ? parseInt(process.env.PLAYWRIGHT_RETRIES || '1') : 0,
  workers: parseInt(process.env.PLAYWRIGHT_WORKERS || '1'), // Use single worker for integration tests by default
  reporter: [
    ['html', { outputFolder: 'integration-report' }],
    ['json', { outputFile: 'integration-results.json' }],
    ['list']
  ],
  
  use: {
    // Global test settings
    baseURL: process.env.PLAYWRIGHT_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Timeouts - integration tests may need more time
    actionTimeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '15000'),
    navigationTimeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000'),
  },

  projects: [
    {
      name: 'chromium-integration',
      use: { 
        ...devices['Desktop Chrome'],
        // Add Chrome flags for better CI performance
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
          ]
        }
      },
    }
  ],

  // Output directories
  outputDir: 'integration-test-results/',
  
  // Global setup and teardown
  timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '60000'), // 60 seconds per test by default
}); 