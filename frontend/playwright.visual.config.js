import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 120000, // 2 minutes per test (increased for mobile)
  reporter: [
    ['html', { outputFolder: 'visual-test-results/html-report' }],
    ['json', { outputFile: 'visual-test-results/reports/test-results.json' }]
  ],
  outputDir: 'visual-test-results/artifacts/',
  
  use: {
    baseURL: 'http://localhost:6006',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30000, // 30 seconds for actions
    navigationTimeout: 60000, // 1 minute for navigation
  },

  expect: {
    // Visual comparison settings
    toHaveScreenshot: {
      threshold: 0.2, // 20% threshold for visual differences (more lenient)
      maxDiffPixels: 2000,
      animations: 'disabled',
      mode: 'rgb',
      timeout: 30000, // 30 seconds for screenshot comparison
    },
    toMatchSnapshot: {
      threshold: 0.2,
      maxDiffPixels: 2000,
      animations: 'disabled',
      timeout: 30000, // 30 seconds for snapshot comparison
    }
  },

  // Make snapshots platform-agnostic (remove OS suffix)
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',

  projects: [
    // Desktop Browsers - Reliable
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 }
      },
    },
    {
      name: 'Desktop Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1024, height: 768 }
      },
    },
    {
      name: 'Desktop Edge',
      use: { 
        ...devices['Desktop Edge'],
        viewport: { width: 1024, height: 768 }
      },
    },
    
    // Mobile Viewports with Chrome Engine - Reliable
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 667 }, // iPhone size
        actionTimeout: 45000,
        navigationTimeout: 90000,
      },
    },
    {
      name: 'Mobile Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 375, height: 667 }, // iPhone size
        actionTimeout: 45000,
        navigationTimeout: 90000,
      },
    },
    
    // Tablet Viewports with Chrome/Firefox - Reliable
    {
      name: 'Tablet Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 }, // iPad size
        actionTimeout: 45000,
        navigationTimeout: 90000,
      },
    },
    {
      name: 'Tablet Firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 768, height: 1024 }, // iPad size
        actionTimeout: 45000,
        navigationTimeout: 90000,
      },
    },
    
    // Different Desktop Sizes - Reliable
    {
      name: 'Large Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },
    {
      name: 'Small Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1366, height: 768 }
      },
    },
  ],

  webServer: {
    command: 'echo "Using existing Storybook Docker container"',
    url: 'http://localhost:6006',
    reuseExistingServer: true,
    timeout: 30000, // 30 seconds to wait for server
  },
}); 