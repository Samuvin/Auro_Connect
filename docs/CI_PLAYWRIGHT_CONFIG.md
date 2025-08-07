# 🎭 Playwright CI Configuration Options

This document describes the configurable options available for Playwright tests in the CI pipeline.

## 🚀 Quick Start

When triggering the CI workflow manually, you can configure the following Playwright options:

### Core Configuration

| Option | Description | Default | Values |
|--------|-------------|---------|--------|
| `playwright_workers` | Number of parallel workers | `11` | Any positive integer |
| `playwright_retries` | Number of test retries on failure | `2` | Any positive integer |
| `playwright_timeout` | Test timeout in milliseconds | `30000` | Any positive integer |

### Browser Selection

| Option | Description | Default | Available Options |
|--------|-------------|---------|-------------------|
| `playwright_browsers` | Which browsers to test | `all` | `all`, `chromium`, `firefox`, `webkit`, `chromium,firefox`, `chromium,webkit`, `firefox,webkit` |

### Device Configuration

| Option | Description | Default | Available Options |
|--------|-------------|---------|-------------------|
| `playwright_devices` | Device types to test | `desktop,mobile` | `desktop,mobile`, `desktop`, `mobile`, `tablet`, `desktop,mobile,tablet`, `desktop,tablet`, `mobile,tablet`, `desktop-large`, `desktop-small`, `all-devices` |

### Development Options

| Option | Description | Default | Usage |
|--------|-------------|---------|-------|
| `playwright_headed` | Run tests with browser UI | `false` | Enable for debugging visual issues |
| `playwright_debug` | Enable debug mode | `false` | Enable for step-by-step debugging |

### Reporting

| Option | Description | Default | Available Options |
|--------|-------------|---------|-------------------|
| `playwright_reporter` | Test report format | `junit` | `junit`, `html`, `json`, `list`, `dot`, `line`, `github` |

### Environment

| Option | Description | Default | Usage |
|--------|-------------|---------|-------|
| `playwright_base_url` | Base URL for tests | `https://auro-connect-r9mk.onrender.com` | Override for testing different environments |

## 🖥️ Available Device Projects

### Desktop Browsers
- **chromium**: Standard Chrome desktop browser
- **firefox**: Firefox desktop browser  
- **webkit**: Safari desktop browser
- **desktop-large**: Chrome with 1920x1080 viewport
- **desktop-small**: Chrome with 1024x768 viewport

### Mobile Browsers
- **mobile-chrome**: Chrome on Pixel 5
- **mobile-safari**: Safari on iPhone 12

### Tablet Browsers
- **tablet-chrome**: Chrome on iPad Pro
- **tablet-safari**: Safari on iPad Pro

## 🎯 Common Use Cases

### Fast Development Testing
```yaml
playwright_workers: 5
playwright_browsers: chromium
playwright_devices: desktop
playwright_retries: 1
```

### Comprehensive Cross-Browser Testing
```yaml
playwright_workers: 11
playwright_browsers: all
playwright_devices: all-devices
playwright_retries: 2
```

### Mobile-Only Testing
```yaml
playwright_workers: 8
playwright_browsers: chromium,webkit
playwright_devices: mobile
playwright_retries: 2
```

### Debug Mode
```yaml
playwright_workers: 1
playwright_browsers: chromium
playwright_devices: desktop
playwright_headed: true
playwright_debug: true
playwright_retries: 0
```

### Performance Testing
```yaml
playwright_workers: 1
playwright_browsers: chromium
playwright_devices: desktop
playwright_timeout: 60000
playwright_retries: 3
```

## 📊 Performance Considerations

- **Workers**: More workers = faster execution but higher resource usage
  - Recommended: 11 for full test suite, 5-8 for quick feedback
- **Device Coverage**: More devices = longer execution time
  - Start with `desktop` for quick iteration, expand to `all-devices` for releases
- **Browser Coverage**: More browsers = longer execution time
  - Use `chromium` for development, `all` for comprehensive testing

## 🔧 Advanced Configuration

### Environment Variables

All options can also be set via environment variables:
- `PLAYWRIGHT_WORKERS`
- `PLAYWRIGHT_BROWSERS` 
- `PLAYWRIGHT_DEVICES`
- `PLAYWRIGHT_RETRIES`
- `PLAYWRIGHT_TIMEOUT`
- `PLAYWRIGHT_BASE_URL`

### Custom Test Commands

The CI generates dynamic Playwright commands based on your selections:

```bash
# Example generated command
npx playwright test \
  --workers=11 \
  --retries=2 \
  --timeout=30000 \
  --reporter=junit \
  --project=chromium \
  --project=firefox \
  --project=webkit \
  --project=mobile-chrome \
  --project=mobile-safari
```

## 🚨 Troubleshooting

### Common Issues

1. **Tests timeout**: Increase `playwright_timeout`
2. **Flaky tests**: Increase `playwright_retries`
3. **Resource constraints**: Reduce `playwright_workers`
4. **Browser-specific issues**: Test single browser first

### Debug Recommendations

1. Enable `playwright_headed: true` for visual debugging
2. Use `playwright_debug: true` for step-by-step execution
3. Set `playwright_workers: 1` for consistent debugging
4. Use `html` reporter for detailed test reports

## 📝 Examples

See `.github/workflows/ci.yml` for the complete implementation of these configuration options. 