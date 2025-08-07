import { test, expect } from '@playwright/test';

test.describe('LoginPage Visual Regression Tests', () => {
  
  test('Complete LoginPage - Desktop View', async ({ page }) => {
    // Go directly to the story
    await page.goto('http://localhost:6006/iframe.html?args=&id=pages-loginpage--complete-login-page&viewMode=story');
    
    // Simple wait for page load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot and compare
    await expect(page).toHaveScreenshot('loginpage-desktop.png');
  });

  test('Complete LoginPage - Mobile View', async ({ page }) => {
    // Go directly to the mobile story
    await page.goto('http://localhost:6006/iframe.html?args=&id=pages-loginpage--mobile-view&viewMode=story');
    
    // Simple wait for page load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot and compare
    await expect(page).toHaveScreenshot('loginpage-mobile.png');
  });

  test('Complete LoginPage - Tablet View', async ({ page }) => {
    // Go directly to the tablet story
    await page.goto('http://localhost:6006/iframe.html?args=&id=pages-loginpage--tablet-view&viewMode=story');
    
    // Simple wait for page load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot and compare
    await expect(page).toHaveScreenshot('loginpage-tablet.png');
  });
}); 