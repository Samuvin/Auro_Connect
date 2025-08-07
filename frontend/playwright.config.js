import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing with TypeScript support
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? parseInt(process.env.PLAYWRIGHT_RETRIES || '2') : 0,
  workers: process.env.CI ? parseInt(process.env.PLAYWRIGHT_WORKERS || '11') : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['list']
  ],
  
  use: {
    // Global test settings
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://auro-connect-r9mk.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Timeouts
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    // Desktop Browsers
    {
      name: 'chromium',
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
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Browsers
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
        // Add Chrome flags for mobile CI performance
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
          ]
        }
      },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Additional Device Options
    {
      name: 'tablet-chrome',
      use: { 
        ...devices['iPad Pro'],
        channel: 'chrome'
      },
    },

    {
      name: 'tablet-safari',
      use: { ...devices['iPad Pro'] },
    },

    // Desktop variations for different screen sizes
    {
      name: 'desktop-large',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
          ]
        }
      },
    },

    {
      name: 'desktop-small',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security'
          ]
        }
      },
    },
  ],

  // Output directories
  outputDir: 'test-results/',
}); 