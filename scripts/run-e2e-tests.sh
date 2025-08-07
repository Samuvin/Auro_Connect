#!/bin/bash

# E2E Test Configuration Script
# Handles complex Playwright configuration based on environment variables

set -e

START_TIME=$(date +%s)

# Build Playwright command with configuration options
PLAYWRIGHT_CMD="npx playwright test"

# Set number of workers
PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --workers=$PLAYWRIGHT_WORKERS"

# Set retry count
PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --retries=$PLAYWRIGHT_RETRIES"

# Set timeout (default 30 seconds)
PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --timeout=30000"

# Set reporter to HTML
PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --reporter=html"

# Configure browsers/projects based on selection
configure_browser_projects() {
    local browsers="$1"
    local devices="$2"
    
    if [ "$browsers" != "all" ]; then
        # Run selected browser with device filtering
        case "$devices" in
            "desktop")
                case "$browsers" in
                    "chromium") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=chromium" ;;
                    "firefox") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=firefox" ;;
                    "webkit") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=webkit" ;;
                esac
                ;;
            "mobile")
                case "$browsers" in
                    "chromium") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=mobile-chrome" ;;
                    "webkit") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=mobile-safari" ;;
                esac
                ;;
            "tablet")
                case "$browsers" in
                    "chromium") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=tablet-chrome" ;;
                    "webkit") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=tablet-safari" ;;
                esac
                ;;
            "all")
                case "$browsers" in
                    "chromium") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=chromium --project=mobile-chrome --project=tablet-chrome" ;;
                    "firefox") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=firefox" ;;
                    "webkit") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=webkit --project=mobile-safari --project=tablet-safari" ;;
                esac
                ;;
        esac
    else
        # All browsers - filter by device type
        case "$devices" in
            "desktop") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=chromium --project=firefox --project=webkit" ;;
            "mobile") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=mobile-chrome --project=mobile-safari" ;;
            "tablet") PLAYWRIGHT_CMD="$PLAYWRIGHT_CMD --project=tablet-chrome --project=tablet-safari" ;;
            "all") ;; # Run all projects (default behavior)
        esac
    fi
}

# Apply configuration
configure_browser_projects "$PLAYWRIGHT_BROWSERS" "$PLAYWRIGHT_DEVICES"

echo "Running command: $PLAYWRIGHT_CMD"
$PLAYWRIGHT_CMD 2>&1 | tee e2e-output.log || true

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Parse Playwright output
PASSED=$(grep -oP '\K\d+(?=\s+passed)' e2e-output.log | tail -1 || echo "0")
FAILED=$(grep -oP '\K\d+(?=\s+failed)' e2e-output.log | tail -1 || echo "0")
TOTAL=$((PASSED + FAILED))

# Write results to GitHub Actions output if running in CI
if [ -n "$GITHUB_OUTPUT" ]; then
    echo "passed=$PASSED" >> $GITHUB_OUTPUT
    echo "failed=$FAILED" >> $GITHUB_OUTPUT
    echo "total=$TOTAL" >> $GITHUB_OUTPUT
    echo "duration=${DURATION}s" >> $GITHUB_OUTPUT
fi

# Output clear summary for notification parsing
echo ""
echo "=== E2E TEST RESULTS SUMMARY ==="
echo "✅ Tests passed: $PASSED"
echo "❌ Tests failed: $FAILED"
echo "📊 Total tests: $TOTAL"
echo "⏱️ Duration: ${DURATION}s"
echo "🔧 Workers: $PLAYWRIGHT_WORKERS"
echo "🌐 Browsers: $PLAYWRIGHT_BROWSERS" 
echo "📱 Devices: $PLAYWRIGHT_DEVICES"
echo "🔄 Retries: $PLAYWRIGHT_RETRIES"
echo "================================="

if [ "$FAILED" -gt "0" ]; then 
    echo "❌ E2E tests failed with $FAILED failures"
    exit 1
else
    echo "✅ All E2E tests passed successfully"
fi 