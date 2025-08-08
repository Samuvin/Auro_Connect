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
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        // Increased timeouts specifically for mobile
        actionTimeout: 45000, // 45 seconds for mobile actions
        navigationTimeout: 90000, // 1.5 minutes for mobile navigation
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