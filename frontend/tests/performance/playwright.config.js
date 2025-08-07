import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright configuration for performance testing including memory leak detection
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '.',
  fullyParallel: false, // Performance tests should run sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? parseInt(process.env.PLAYWRIGHT_RETRIES || '2') : 0,
  workers: parseInt(process.env.PLAYWRIGHT_WORKERS || '1'), // Single worker for consistent performance measurements by default
  reporter: [
    ['html', { outputFolder: '../../playwright-report' }],
    ['json', { outputFile: '../../test-results/performance-results.json' }],
    ['list']
  ],
  
  use: {
    // Global test settings
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://auro-connect-r9mk.onrender.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Browser context options for performance testing
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Performance-focused settings
    actionTimeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000'),
    navigationTimeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000'),
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
      name: 'chromium-memory-leak-detection',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome flags specifically for memory leak detection
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--enable-network-service',
            '--force-fieldtrials=NetworkService/Enabled',
            // Memory-specific flags
            '--enable-precise-memory-info',
            '--enable-memory-pressure-api',
            '--js-flags=--expose-gc',
            '--max-old-space-size=4096',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-features=TranslateUI,BlinkGenPropertyTrees,VizDisplayCompositor',
            '--enable-devtools-experiments'
          ]
        }
      },
      testMatch: '**/memory-leak.spec.js',
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
      testIgnore: '**/memory-leak.spec.js', // Skip memory tests on mobile
    },
  ],

  // Output directories
  outputDir: '../../test-results/',
  
  // Global setup and teardown
  globalSetup: path.join(__dirname, 'global-setup.js'),
  globalTeardown: path.join(__dirname, 'global-teardown.js'),
}); 