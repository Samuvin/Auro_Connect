# Performance Testing with Lighthouse + Playwright

This directory contains comprehensive performance testing tools that use Playwright's browser context to run Lighthouse audits, providing detailed performance analysis of the Auro Connect application.

## 🚀 Quick Start

### Prerequisites

1. Install dependencies:
```bash
cd frontend
npm install
npm run playwright:install
```

2. Run performance tests:
```bash
# Run all performance tests
npm run test:perf

# Run with browser visible (headed mode)
npm run test:perf:headed

# Run standalone Lighthouse audit
npm run test:lighthouse

# Run Lighthouse in CI mode
npm run test:lighthouse:ci

# View reports
npm run open:perf-reports
```

## 📁 Files Overview

- **`playwright.config.js`** - Playwright configuration for performance testing
- **`lighthouse-with-playwright.js`** - Custom Lighthouse runner using Playwright browser context
- **`performance-e2e.spec.js`** - Comprehensive E2E performance tests using our custom integration
- **`global-setup.js`** - Test environment setup
- **`global-teardown.js`** - Test environment cleanup

## 🧪 Test Types

### 1. Homepage Performance Audit
Tests the initial page load performance including Core Web Vitals.

### 2. User Authentication Flow Performance
Simulates user login process and measures performance impact.

### 3. Interactive Page Performance
Tests performance during user interactions like scrolling and clicking.

### 4. Mobile Performance Audit
Tests performance on mobile devices with network throttling.

### 5. Custom Lighthouse Integration
Demonstrates advanced Playwright + Lighthouse integration with custom pre-audit actions.

## 📊 Performance Metrics

The tests measure and report on:

- **Core Web Vitals:**
  - Largest Contentful Paint (LCP)
  - First Input Delay (FID)
  - Cumulative Layout Shift (CLS)
  - First Contentful Paint (FCP)
  - Speed Index

- **Lighthouse Categories:**
  - Performance (threshold: 70%)
  - Accessibility (threshold: 90%)
  - Best Practices (threshold: 80%)
  - SEO (threshold: 80%)

## 🎯 Performance Thresholds

Default thresholds can be customized in the configuration:

```javascript
const thresholds = {
  performance: 70,
  accessibility: 90,
  'best-practices': 80,
  seo: 80
};
```

## 📈 Reports and Output

Performance tests generate multiple types of reports:

### HTML Reports
- Interactive Lighthouse reports viewable in browser
- Located in `lighthouse-reports/` directory

### JSON Reports
- Raw Lighthouse data for programmatic analysis
- Performance metrics for further processing

### Summary Reports
- Condensed performance insights
- Core Web Vitals summary
- Optimization recommendations

### Test Results
- Playwright test results with screenshots/videos on failure
- Performance metrics collected during E2E tests

## 🔧 Configuration

### Playwright Configuration
```javascript
// playwright.config.js
export default defineConfig({
  use: {
    baseURL: 'https://auro-connect-r9mk.onrender.com',
    viewport: { width: 1280, height: 720 },
    // Performance-focused settings
  }
});
```

### Lighthouse Configuration
```javascript
// lighthouse-with-playwright.js
const config = {
  url: 'https://auro-connect-r9mk.onrender.com/',
  thresholds: { /* ... */ },
  lighthouseOptions: {
    extends: 'lighthouse:default',
    settings: {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor: 'desktop'
    }
  }
};
```

## 🛠️ Advanced Usage

### Custom Pre-Audit Actions

You can customize the Lighthouse runner to perform specific actions before auditing:

```javascript
const results = await runLighthouseWithPlaywright(url, {
  preAuditActions: async (page) => {
    // Login user
    await page.fill('#email', 'user@example.com');
    await page.fill('#password', 'password');
    await page.click('#login-button');
    await page.waitForNavigation();
    
    // Navigate to specific page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  }
});
```

### Custom Lighthouse Options

Override Lighthouse settings for specific tests:

```javascript
const results = await runLighthouseWithPlaywright(url, {
  lighthouseOptions: {
    settings: {
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4
      }
    }
  }
});
```

### Custom Performance Marks

Add performance marks in your tests:

```javascript
test('Custom Performance Tracking', async ({ page }) => {
  await page.addInitScript(() => {
    window.markPerformance = (name) => {
      performance.mark(name);
    };
  });
  
  await page.goto('/');
  await page.evaluate(() => window.markPerformance('page-ready'));
  
  // Your test actions here...
  
  const metrics = await page.evaluate(() => {
    return performance.getEntriesByType('mark');
  });
});
```

## 🏃‍♂️ Running Tests

### Local Development
```bash
# Run all performance tests
npm run test:perf

# Run specific test file
npx playwright test tests/performance/performance-e2e.spec.js

# Run with specific browser
npx playwright test tests/performance/ --project=chromium-performance

# Debug mode (headed browser)
npx playwright test tests/performance/ --headed --debug

# Run standalone Lighthouse
npm run test:lighthouse
```

### CI/CD Integration
```bash
# Run in CI mode with JUnit reporter
npm run test:perf:ci

# Run standalone Lighthouse in CI
npm run test:lighthouse:ci
```

## 📝 Interpreting Results

### Performance Scores
- **90-100**: Excellent
- **70-89**: Good
- **50-69**: Needs Improvement
- **0-49**: Poor

### Core Web Vitals Targets
- **LCP**: < 2.5s (Good), < 4.0s (Needs Improvement)
- **FID**: < 100ms (Good), < 300ms (Needs Improvement)
- **CLS**: < 0.1 (Good), < 0.25 (Needs Improvement)

### Optimization Opportunities
The reports will highlight specific areas for improvement such as:
- Image optimization
- Code splitting
- Resource compression
- Render-blocking resources
- Unused JavaScript/CSS

## 🔍 Troubleshooting

### Common Issues

1. **Chrome not found**: Run `npm run playwright:install`
2. **Tests timing out**: Increase timeout in playwright.config.js
3. **Network issues**: Check if the target URL is accessible
4. **Permission errors**: Ensure write permissions for report directories
5. **Port conflicts**: If port 9222 is in use, the script will handle it automatically

### Debug Mode
```bash
# Run with debug output
DEBUG=pw:api npm run test:perf

# Run with browser visible
npm run test:perf:headed

# Run standalone Lighthouse with debug
DEBUG=lighthouse npm run test:lighthouse
```

## 🏗️ Architecture

Our custom integration works by:

1. **Playwright launches Chrome** with remote debugging enabled
2. **Pre-audit actions** are performed using Playwright (login, navigation, interactions)
3. **Lighthouse connects** to the same Chrome instance via debugging port
4. **Lighthouse runs audit** on the prepared page state
5. **Reports are generated** with detailed metrics and recommendations

This approach provides:
- Better control over page state before auditing
- Realistic user interactions before measurement
- Consistent browser context between preparation and auditing
- No dependency on third-party integrations

## 🤝 Contributing

When adding new performance tests:

1. Follow the existing test structure
2. Add appropriate performance thresholds
3. Use `runLighthouseWithPlaywright` for Lighthouse audits
4. Include custom pre-audit actions when needed
5. Document any custom configurations
6. Update this README if adding new test types

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Core Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)

---

For questions or issues, please refer to the project documentation or create an issue in the repository. 