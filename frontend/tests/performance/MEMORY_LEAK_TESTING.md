# Memory Leak Testing with Playwright

This directory contains comprehensive memory leak detection tests for the frontend application using Playwright and Chrome DevTools Protocol.

## Overview

Memory leaks in frontend applications can cause performance degradation, crashes, and poor user experience. This testing suite helps identify potential memory leaks by monitoring heap usage during various operations.

## Test Files

- `memory-leak.spec.js` - Main memory leak detection tests
- `memory-utils.js` - Utility functions for memory monitoring
- `playwright.config.js` - Playwright configuration with memory-specific Chrome flags

## Available Scripts

### Running Memory Leak Tests

```bash
# Run memory leak tests
npm run test:memory-leaks

# Run with browser UI (for debugging)
npm run test:memory-leaks:headed

# Run for CI/CD pipeline
npm run test:memory-leaks:ci

# Run all performance tests (including memory leaks)
npm run test:all-performance
```

## Test Categories

### 1. Navigation Memory Leaks
Tests memory usage during repeated navigation between routes.

**What it detects:**
- Memory not being freed when components unmount
- Route-specific memory accumulation
- Router-related memory leaks

**Thresholds:**
- Total growth: < 50MB after multiple navigations
- Per-iteration growth: < 20MB

### 2. Event Listener Cleanup
Tests that event listeners are properly removed when components unmount.

**What it detects:**
- Event listeners not being cleaned up
- DOM event memory leaks
- Window/document event accumulation

### 3. Timer Cleanup
Tests that timers (setTimeout, setInterval) are properly cleared.

**What it detects:**
- Uncleaned intervals and timeouts
- Timer-related memory accumulation
- Background process leaks

### 4. Large Data Operations
Tests memory usage during data processing operations.

**What it detects:**
- Memory not freed after data processing
- Inefficient data handling
- Memory accumulation in state management

### 5. DOM Node Leaks
Tests for DOM nodes that aren't properly garbage collected.

**What it detects:**
- Detached DOM nodes in memory
- Element reference leaks
- Dynamic content cleanup issues

### 6. User Interaction Memory
Tests memory usage during typical user interactions.

**What it detects:**
- Memory growth during normal usage
- Interaction-specific leaks
- UI component memory issues

## Configuration

### Chrome Flags for Memory Testing

The memory leak detection tests use specific Chrome flags:

```javascript
// Memory-specific flags
'--enable-precise-memory-info',
'--enable-memory-pressure-api', 
'--js-flags=--expose-gc',
'--max-old-space-size=4096',
'--disable-background-timer-throttling',
'--disable-backgrounding-occluded-windows',
'--disable-renderer-backgrounding'
```

### Memory Thresholds

Default thresholds are defined in `memory-utils.js`:

```javascript
export const MEMORY_THRESHOLDS = {
  NAVIGATION: {
    TOTAL_GROWTH_MB: 50,
    ITERATION_GROWTH_MB: 20,
  },
  USER_INTERACTIONS: {
    TOTAL_GROWTH_MB: 25,
    PEAK_MEMORY_MB: 200,
  },
  // ... more thresholds
};
```

## Using Memory Utilities

### Basic Memory Monitoring

```javascript
import { getMemoryUsage, enableMemoryMonitoring, forceGarbageCollection } from './memory-utils.js';

// Get current memory usage
const memory = await getMemoryUsage(page);
console.log(`Memory usage: ${memory.usedJSHeapSize / 1024 / 1024}MB`);

// Enable advanced memory monitoring
const client = await enableMemoryMonitoring(page);
await forceGarbageCollection(client);
```

### Monitor Memory During Actions

```javascript
import { monitorMemoryDuringAction } from './memory-utils.js';

const result = await monitorMemoryDuringAction(page, async () => {
  // Perform some action that might leak memory
  await page.click('#load-data-button');
  await page.waitForSelector('.data-loaded');
}, {
  enableGC: true,
  sampleInterval: 500,
  maxSamples: 20,
});

console.log(`Memory growth: ${result.memoryGrowth}MB`);
```

### Test Navigation Memory Leaks

```javascript
import { testNavigationMemoryLeaks } from './memory-utils.js';

const routes = ['/', '/dashboard', '/profile', '/settings'];
const result = await testNavigationMemoryLeaks(page, routes, {
  iterations: 3,
  maxAllowedGrowthMB: 50,
});

console.log(`Memory leak test: ${result.passed ? 'PASSED' : 'FAILED'}`);
```

## Writing Custom Memory Tests

### Basic Structure

```javascript
import { test, expect } from '@playwright/test';
import { 
  getMemoryUsage, 
  enableMemoryMonitoring, 
  forceGarbageCollection,
  createMemoryReporter 
} from './memory-utils.js';

test('custom memory leak test', async ({ page }) => {
  const reporter = createMemoryReporter('Custom Test');
  const client = await enableMemoryMonitoring(page);
  
  // Baseline measurement
  await forceGarbageCollection(client);
  const baseline = await getMemoryUsage(page);
  reporter.logMemoryUsage('baseline', baseline);
  
  // Perform operations that might leak memory
  await page.goto('/test-page');
  // ... test operations ...
  
  // Final measurement
  await forceGarbageCollection(client);
  const final = await getMemoryUsage(page);
  reporter.logMemoryDifference(baseline, final, 'final');
  
  // Assert memory growth is within acceptable limits
  const growthMB = (final.usedJSHeapSize - baseline.usedJSHeapSize) / 1024 / 1024;
  expect(growthMB).toBeLessThan(25);
  
  await client.detach();
});
```

## Interpreting Results

### Memory Growth Indicators

- **Low (< 20MB)**: Normal application behavior
- **Medium (20-50MB)**: Monitor for patterns, might indicate minor leaks
- **High (50-100MB)**: Likely memory leak, investigate immediately
- **Critical (> 100MB)**: Severe memory leak, requires immediate attention

### Common Patterns

**Steady Growth**: Memory increases consistently over time
- Usually indicates: Event listeners, timers, or closure leaks

**Spiky Growth**: Memory jumps at specific operations
- Usually indicates: Large object creation without cleanup

**Plateau Growth**: Memory grows then stabilizes
- Usually indicates: One-time allocations (caches, etc.)

## Debugging Memory Leaks

### 1. Enable Headed Mode
```bash
npm run test:memory-leaks:headed
```
This opens the browser so you can use DevTools during tests.

### 2. Use Chrome DevTools
- Open DevTools → Memory tab
- Take heap snapshots before/after operations
- Use the Comparison view to see what's retained

### 3. Add Custom Logging
```javascript
// Add detailed logging to understand memory patterns
const memory = await getMemoryUsage(page);
console.log('Memory details:', {
  used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
  total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
  limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB',
});
```

## Best Practices

### For Application Development

1. **Always cleanup event listeners**
   ```javascript
   useEffect(() => {
     const handler = () => { /* ... */ };
     document.addEventListener('click', handler);
     return () => document.removeEventListener('click', handler);
   }, []);
   ```

2. **Clear timers in cleanup**
   ```javascript
   useEffect(() => {
     const timer = setInterval(() => { /* ... */ }, 1000);
     return () => clearInterval(timer);
   }, []);
   ```

3. **Avoid creating functions in render**
   ```javascript
   // ❌ Creates new function on every render
   <button onClick={() => handleClick(item.id)}>
   
   // ✅ Use useCallback or define outside render
   const handleClick = useCallback((id) => { /* ... */ }, []);
   <button onClick={() => handleClick(item.id)}>
   ```

### For Testing

1. **Run tests regularly** - Include in CI/CD pipeline
2. **Test realistic scenarios** - Use actual user flows
3. **Monitor trends** - Track memory usage over time
4. **Set appropriate thresholds** - Based on your app's requirements
5. **Test on different devices** - Memory constraints vary

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Memory Leak Tests
on: [push, pull_request]

jobs:
  memory-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:memory-leaks:ci
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: memory-test-results
          path: test-results/
```

## Troubleshooting

### Common Issues

**Tests timing out**
- Increase timeout in playwright config
- Check if routes are accessible
- Verify application is running

**Inconsistent results**
- Ensure tests run sequentially (workers: 1)
- Allow more time for garbage collection
- Check for external factors affecting memory

**High memory baseline**
- Application might have initial memory overhead
- Adjust thresholds accordingly
- Check for unnecessary initial data loading

### Getting Help

If you encounter issues with memory leak detection:

1. Check the test logs for detailed memory measurements
2. Use headed mode to inspect the application state
3. Compare results across different environments
4. Consider the application's specific memory patterns

## Resources

- [Chrome DevTools Memory Tab](https://developer.chrome.com/docs/devtools/memory/)
- [JavaScript Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
- [React Memory Leaks](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
- [Playwright Testing](https://playwright.dev/docs/intro) 