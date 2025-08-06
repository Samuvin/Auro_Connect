import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright configuration for performance testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: false, // Performance tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for consistent performance measurements
  reporter: [
    ['html', { outputFolder: '../../playwright-report' }],
    ['json', { outputFile: '../../test-results/performance-results.json' }],
    ['list']
  ],
  
  use: {
    // Global test settings
    baseURL: 'https://auro-connect-r9mk.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Browser context options for performance testing
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Performance-focused settings
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium-performance',
      use: { 
        ...devices['Desktop Chrome'],
        // Additional Chrome flags for performance testing
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--enable-network-service',
            '--force-fieldtrials=NetworkService/Enabled'
          ]
        }
      },
    },

    {
      name: 'mobile-performance',
      use: { 
        ...devices['Pixel 5'],
        // Mobile-specific performance settings
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
  outputDir: '../../test-results/',
  
  // Global setup and teardown
  globalSetup: path.join(__dirname, 'global-setup.js'),
  globalTeardown: path.join(__dirname, 'global-teardown.js'),
}); 