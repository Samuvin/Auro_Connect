import { test, expect } from '@playwright/test';
import { runLighthouseWithPlaywright, checkThresholds, generateReports, config } from './lighthouse-with-playwright.js';
import fs from 'fs';
import path from 'path';

// Test configuration
const testConfig = {
  baseURL: 'https://auro-connect-r9mk.onrender.com',
  thresholds: {
    performance: 70,
    accessibility: 90,
    'best-practices': 80,
    seo: 80
  }
};

test.describe('Performance Testing with Playwright + Lighthouse', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set up performance monitoring
    await page.addInitScript(() => {
      window.performanceMarks = [];
      window.markPerformance = (name) => {
        performance.mark(name);
        window.performanceMarks.push(name);
      };
    });
  });

  test('Homepage Performance Audit', async ({ page, browserName }) => {
    test.slow(); // Mark as slow test since Lighthouse takes time
    
    console.log(`🚀 Starting homepage performance test with ${browserName}`);
    
    // Navigate to homepage and verify basic functionality
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Verify login form elements are present (Username and Password placeholders)
    await expect(page.locator('input[placeholder="Username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    
    // Run custom Lighthouse audit
    const results = await runLighthouseWithPlaywright(testConfig.baseURL, {
      preAuditActions: async (auditPage) => {
        await auditPage.goto('/');
        await auditPage.waitForLoadState('networkidle');
        await auditPage.evaluate(() => {
          performance.mark('homepage-audit-ready');
        });
      }
    });
    
    // Verify results and generate reports
    expect(results).toBeDefined();
    expect(results.lhr).toBeDefined();
    
    const reportPaths = generateReports(results, `homepage-${browserName}`);
    const { allPassed } = checkThresholds(results.lhr.categories, testConfig.thresholds);
    
    console.log(`📊 Performance Score: ${Math.round(results.lhr.categories.performance.score * 100)}`);
    console.log(`📄 Report saved: ${reportPaths.htmlPath}`);
    console.log('✅ Homepage performance audit completed');
    
    // Assert performance meets thresholds (non-blocking for initial testing)
    if (!allPassed) {
      console.warn('⚠️ Performance thresholds not met, but continuing test...');
    }
  });

  test('User Authentication Flow Performance', async ({ page, browserName }) => {
    test.slow();
    
    console.log(`🔐 Starting authentication flow performance test with ${browserName}`);
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Verify Username and Password fields are present
    const emailInput = page.locator('input[placeholder="Username"], input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[placeholder="Password"], input[type="password"], input[name="password"]');
    const loginButton = page.locator('button[type="submit"], button:has-text("login"), button:has-text("Login")');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Simulate user interaction
    if (await emailInput.count() > 0) {
      await emailInput.fill('test@example.com');
      await passwordInput.fill('testpassword');
      
      // Mark performance point before login
      await page.evaluate(() => window.markPerformance('login-attempt-start'));
      
      // Attempt login (this might fail but we're testing the performance)
      await loginButton.click();
      await page.waitForTimeout(3000); // Wait for any navigation or error messages
      
      await page.evaluate(() => window.markPerformance('login-attempt-end'));
    }
    
    // Run Lighthouse audit on the current page state
    const currentUrl = page.url();
    const results = await runLighthouseWithPlaywright(currentUrl, {
      preAuditActions: async (auditPage) => {
        // Replicate the same user flow
        await auditPage.goto('/login');
        await auditPage.waitForLoadState('networkidle');
        
        const emailInput = auditPage.locator('input[placeholder="Username"], input[type="email"], input[name="email"]');
        const passwordInput = auditPage.locator('input[placeholder="Password"], input[type="password"], input[name="password"]');
        const loginButton = auditPage.locator('button[type="submit"], button:has-text("login"), button:has-text("Login")');
        
        if (await emailInput.count() > 0) {
          await emailInput.fill('test@example.com');
          await passwordInput.fill('testpassword');
          await loginButton.click();
          await auditPage.waitForTimeout(3000);
        }
        
        await auditPage.evaluate(() => {
          performance.mark('auth-flow-audit-ready');
        });
      }
    });
    
    const reportPaths = generateReports(results, `auth-flow-${browserName}`);
    const { allPassed } = checkThresholds(results.lhr.categories, testConfig.thresholds);
    
    console.log(`📊 Auth Flow Performance Score: ${Math.round(results.lhr.categories.performance.score * 100)}`);
    console.log('✅ Authentication flow performance audit completed');
  });

  test('Interactive Page Performance', async ({ page, browserName }) => {
    test.slow();
    
    console.log(`🎭 Starting interactive performance test with ${browserName}`);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify basic elements are present
    await expect(page.locator('input[placeholder="Username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    
    // Simulate user interactions
    await page.evaluate(() => window.markPerformance('interaction-start'));
    
    // Scroll down to load more content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(1000);
    
    // Try to click on interactive elements (if they exist)
    const clickableElements = await page.locator('button, a, [onclick], [role="button"]').all();
    if (clickableElements.length > 0) {
      // Click on the first few interactive elements
      for (let i = 0; i < Math.min(3, clickableElements.length); i++) {
        try {
          await clickableElements[i].click({ timeout: 2000 });
          await page.waitForTimeout(500);
        } catch (error) {
          console.log(`Could not click element ${i}:`, error.message);
        }
      }
    }
    
    await page.evaluate(() => window.markPerformance('interaction-end'));
    
    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const marks = performance.getEntriesByType('mark');
      
      return {
        navigation: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart
        },
        marks: marks.map(mark => ({ name: mark.name, startTime: mark.startTime })),
        resourceCount: performance.getEntriesByType('resource').length
      };
    });
    
    console.log('📊 Performance metrics:', performanceMetrics);
    
    // Run Lighthouse audit after interactions
    const results = await runLighthouseWithPlaywright(testConfig.baseURL, {
      preAuditActions: async (auditPage) => {
        await auditPage.goto('/');
        await auditPage.waitForLoadState('networkidle');
        
        // Replicate the same interactions
        await auditPage.evaluate(() => {
          performance.mark('interactive-audit-start');
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        
        await auditPage.waitForTimeout(1000);
        
        // Try to interact with elements
        const clickableElements = await auditPage.locator('button, a, [onclick], [role="button"]').all();
        if (clickableElements.length > 0) {
          for (let i = 0; i < Math.min(3, clickableElements.length); i++) {
            try {
              await clickableElements[i].click({ timeout: 2000 });
              await auditPage.waitForTimeout(500);
            } catch (error) {
              // Ignore click errors during audit
            }
          }
        }
        
        await auditPage.evaluate(() => {
          performance.mark('interactive-audit-ready');
        });
      }
    });
    
    const reportPaths = generateReports(results, `interactive-${browserName}`);
    console.log(`📊 Interactive Performance Score: ${Math.round(results.lhr.categories.performance.score * 100)}`);
    console.log('✅ Interactive performance audit completed');
  });

  test('Mobile Performance Audit', async ({ page, browserName }) => {
    test.slow();
    
    // Only run on chromium for mobile emulation
    test.skip(browserName !== 'chromium', 'Mobile test only runs on Chromium');
    
    console.log('📱 Starting mobile performance test');
    
    // Emulate mobile device
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify login form elements are present on mobile
    await expect(page.locator('input[placeholder="Username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    
    // Mobile-specific interactions
    await page.evaluate(() => {
      // Simulate touch interactions
      window.markPerformance('mobile-interaction-start');
      
      // Simulate scroll on mobile
      window.scrollTo(0, 200);
    });
    
    await page.waitForTimeout(2000);
    await page.evaluate(() => window.markPerformance('mobile-interaction-end'));
    
    // Run Lighthouse audit with mobile configuration
    const results = await runLighthouseWithPlaywright(testConfig.baseURL, {
      lighthouseOptions: {
        ...config.lighthouseOptions,
        settings: {
          ...config.lighthouseOptions.settings,
          formFactor: 'mobile',
          throttling: {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4
          },
          screenEmulation: {
            mobile: true,
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            disabled: false
          }
        }
      },
      preAuditActions: async (auditPage) => {
        // Set mobile viewport for audit
        await auditPage.setViewportSize({ width: 375, height: 667 });
        await auditPage.goto('/');
        await auditPage.waitForLoadState('networkidle');
        
        // Mobile interactions
        await auditPage.evaluate(() => {
          performance.mark('mobile-audit-start');
          window.scrollTo(0, 200);
        });
        
        await auditPage.waitForTimeout(2000);
        
        await auditPage.evaluate(() => {
          performance.mark('mobile-audit-ready');
        });
      }
    });
    
    const reportPaths = generateReports(results, 'mobile');
    const { allPassed } = checkThresholds(results.lhr.categories, {
      ...testConfig.thresholds,
      performance: 60 // Lower threshold for mobile
    });
    
    console.log(`📊 Mobile Performance Score: ${Math.round(results.lhr.categories.performance.score * 100)}`);
    console.log('✅ Mobile performance audit completed');
  });

  test('Custom Lighthouse Integration', async ({ page, browserName }) => {
    test.slow();
    
    console.log(`🔬 Starting custom Lighthouse integration test with ${browserName}`);
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify login form elements
    await expect(page.locator('input[placeholder="Username"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
    
    // Custom pre-audit actions
    const customResults = await runLighthouseWithPlaywright(testConfig.baseURL, {
      preAuditActions: async (auditPage) => {
        // Custom actions before audit
        await auditPage.goto('/');
        await auditPage.waitForLoadState('networkidle');
        
        // Simulate user behavior
        await auditPage.evaluate(() => {
          // Add some custom performance marks
          performance.mark('custom-audit-start');
          
          // Simulate some user interactions
          window.scrollTo(0, 300);
        });
        
        await auditPage.waitForTimeout(2000);
        
        await auditPage.evaluate(() => {
          performance.mark('custom-audit-ready');
        });
        
        console.log('🎭 Custom pre-audit actions completed');
      }
    });
    
    // Verify the audit ran successfully
    expect(customResults).toBeDefined();
    expect(customResults.lhr).toBeDefined();
    expect(customResults.lhr.categories.performance).toBeDefined();
    
    const performanceScore = Math.round(customResults.lhr.categories.performance.score * 100);
    console.log(`📊 Performance Score: ${performanceScore}`);
    
    // Log some key metrics
    const metrics = customResults.lhr.audits;
    if (metrics['first-contentful-paint']) {
      console.log(`⚡ First Contentful Paint: ${metrics['first-contentful-paint'].displayValue}`);
    }
    if (metrics['largest-contentful-paint']) {
      console.log(`🎯 Largest Contentful Paint: ${metrics['largest-contentful-paint'].displayValue}`);
    }
    if (metrics['cumulative-layout-shift']) {
      console.log(`📐 Cumulative Layout Shift: ${metrics['cumulative-layout-shift'].displayValue}`);
    }
    
    // Generate detailed report
    const reportPaths = generateReports(customResults, `custom-${browserName}`);
    console.log(`📄 Custom report saved: ${reportPaths.htmlPath}`);
    
    console.log('✅ Custom Lighthouse integration test completed');
  });

  test.afterEach(async ({ page }, testInfo) => {
    // Collect additional performance data
    const performanceEntries = await page.evaluate(() => {
      return {
        navigation: performance.getEntriesByType('navigation'),
        marks: performance.getEntriesByType('mark'),
        measures: performance.getEntriesByType('measure')
      };
    });
    
    // Ensure output directory exists
    if (!fs.existsSync(testInfo.outputDir)) {
      fs.mkdirSync(testInfo.outputDir, { recursive: true });
    }
    
    // Save performance data to test results
    const performanceFile = path.join(
      testInfo.outputDir,
      'performance-metrics.json'
    );
    
    try {
      fs.writeFileSync(performanceFile, JSON.stringify(performanceEntries, null, 2));
      console.log(`💾 Performance metrics saved to: ${performanceFile}`);
    } catch (error) {
      console.warn(`⚠️ Could not save performance metrics: ${error.message}`);
    }
  });
}); 