#!/bin/bash

# Slack Notification Script
# Handles Slack message generation and sending for CI/CD pipeline results
# Enhanced with detailed test results and performance metrics parsing

set -e

# Parse GitHub context from environment variable
GITHUB_SHA=$(echo "$GITHUB_CONTEXT" | jq -r '.sha')
GITHUB_REF_NAME=$(echo "$GITHUB_CONTEXT" | jq -r '.ref_name')
GITHUB_ACTOR=$(echo "$GITHUB_CONTEXT" | jq -r '.actor')
GITHUB_EVENT_NAME=$(echo "$GITHUB_CONTEXT" | jq -r '.event_name')
GITHUB_WORKFLOW=$(echo "$GITHUB_CONTEXT" | jq -r '.workflow')
GITHUB_SERVER_URL=$(echo "$GITHUB_CONTEXT" | jq -r '.server_url')
GITHUB_REPOSITORY=$(echo "$GITHUB_CONTEXT" | jq -r '.repository')
GITHUB_RUN_ID=$(echo "$GITHUB_CONTEXT" | jq -r '.run_id')

# Function to parse E2E test results from artifacts
parse_e2e_results() {
    local e2e_passed=0
    local e2e_failed=0
    local e2e_total=0
    local e2e_duration="0s"
    
    # Look for E2E test results in artifacts
    if [ -f "artifacts/e2e-test-results/e2e-output.log" ]; then
        local log_file="artifacts/e2e-test-results/e2e-output.log"
        echo "📊 Found E2E output log: $log_file" >&2
        
        # Parse test results - try multiple patterns for robustness
        e2e_passed=$(grep -oP '\K\d+(?=\s+passed)' "$log_file" | tail -1 2>/dev/null || \
                     grep -oP 'Tests passed:\s*\K\d+' "$log_file" | tail -1 2>/dev/null || echo "0")
        e2e_failed=$(grep -oP '\K\d+(?=\s+failed)' "$log_file" | tail -1 2>/dev/null || \
                     grep -oP 'Tests failed:\s*\K\d+' "$log_file" | tail -1 2>/dev/null || echo "0")
        
        # Calculate total
        e2e_total=$((e2e_passed + e2e_failed))
        
        # Extract duration if available - try multiple patterns
        e2e_duration=$(grep -oP 'Duration:\s*\K\d+s' "$log_file" | tail -1 2>/dev/null || \
                       grep -oP '⏱️ Duration:\s*\K\d+s' "$log_file" | tail -1 2>/dev/null || \
                       grep -oP 'duration=\K[^s]+s' "$log_file" | tail -1 2>/dev/null || echo "0s")
        
        echo "🎭 Parsed E2E results: $e2e_passed passed, $e2e_failed failed, total $e2e_total" >&2
    else
        echo "⚠️ E2E output log not found: artifacts/e2e-test-results/e2e-output.log" >&2
    fi
    
    echo "$e2e_passed|$e2e_failed|$e2e_total|$e2e_duration"
}

# Function to parse performance metrics from Lighthouse reports
parse_performance_metrics() {
    local perf_score="N/A"
    local fcp="N/A"
    local lcp="N/A"
    local cls="N/A"
    local tbt="N/A"
    
    # Look for Lighthouse JSON reports in artifacts
    local lighthouse_dir="artifacts/performance-test-results/lighthouse-reports"
    if [ -d "$lighthouse_dir" ]; then
        # Find the most recent Lighthouse JSON report
        local json_report=$(find "$lighthouse_dir" -name "*.json" -type f | head -1)
        if [ -f "$json_report" ]; then
            echo "📊 Found Lighthouse report: $json_report" >&2
            # Parse performance metrics using jq with error handling
            if command -v jq >/dev/null 2>&1; then
                perf_score=$(jq -r '.categories.performance.score * 100 | floor' "$json_report" 2>/dev/null || echo "N/A")
                fcp=$(jq -r '.audits."first-contentful-paint".displayValue // "N/A"' "$json_report" 2>/dev/null)
                lcp=$(jq -r '.audits."largest-contentful-paint".displayValue // "N/A"' "$json_report" 2>/dev/null)
                cls=$(jq -r '.audits."cumulative-layout-shift".displayValue // "N/A"' "$json_report" 2>/dev/null)
                tbt=$(jq -r '.audits."total-blocking-time".displayValue // "N/A"' "$json_report" 2>/dev/null)
            else
                echo "⚠️ jq not available, skipping detailed performance parsing" >&2
            fi
        else
            echo "⚠️ No Lighthouse JSON report found in $lighthouse_dir" >&2
        fi
    else
        echo "⚠️ Lighthouse reports directory not found: $lighthouse_dir" >&2
    fi
    
    echo "$perf_score|$fcp|$lcp|$cls|$tbt"
}

# Function to parse unit test results
parse_unit_test_results() {
    local total_passed=0
    local total_failed=0
    local coverage="N/A"
    
    # Look for unit test results in artifacts
    for component in "frontend" "backend"; do
        local coverage_file="artifacts/unit-test-results-${component}/coverage/coverage-summary.json"
        if [ -f "$coverage_file" ]; then
            # Extract coverage percentage
            local comp_coverage=$(jq -r '.total.lines.pct // 0' "$coverage_file" 2>/dev/null || echo "0")
            if [ "$coverage" = "N/A" ]; then
                coverage="${comp_coverage}%"
            else
                coverage="${coverage}, ${comp_coverage}%"
            fi
        fi
    done
    
    echo "$total_passed|$total_failed|$coverage"
}

# Function to determine overall status
determine_status() {
    local setup_result="$1"
    local lint_result="$2"
    local test_results="$3"
    local performance_results="$4"
    
    if [[ "$setup_result" == "failure" ]]; then
        echo "❌ CI Pipeline FAILED"
        echo "danger"
        return
    fi
    
    # Check if any critical stages failed
    if [[ "$lint_result" == "failure" ]] || [[ "$test_results" == *"failure"* ]] || [[ "$performance_results" == *"failure"* ]]; then
        echo "🟡 CI Pipeline UNSTABLE"
        echo "warning"
        return
    fi
    
    echo "✅ CI Pipeline SUCCESS"
    echo "good"
}

# Function to build enhanced field value based on job result and metrics
build_enhanced_field_value() {
    local job_type="$1"
    local job_result="$2"
    local metrics="$3"
    
    case "$job_type" in
        "e2e")
            if [ "$job_result" = "success" ] && [ -n "$metrics" ]; then
                IFS='|' read -r passed failed total duration <<< "$metrics"
                if [ "$total" -gt 0 ]; then
                    echo "✅ $passed passed, $failed failed\\n📊 Total: $total tests\\n⏱️ Duration: $duration"
                else
                    echo "✅ Success"
                fi
            elif [ "$job_result" = "failure" ] && [ -n "$metrics" ]; then
                IFS='|' read -r passed failed total duration <<< "$metrics"
                echo "❌ $passed passed, $failed failed\\n📊 Total: $total tests\\n⏱️ Duration: $duration"
            else
                build_field_value "$job_result"
            fi
            ;;
        "performance")
            if [ "$job_result" = "success" ] && [ -n "$metrics" ]; then
                IFS='|' read -r score fcp lcp cls tbt <<< "$metrics"
                if [ "$score" != "N/A" ]; then
                    echo "✅ Performance Score: ${score}/100\\n🎯 FCP: $fcp, LCP: $lcp\\n📐 CLS: $cls, TBT: $tbt"
                else
                    echo "✅ Success"
                fi
            else
                build_field_value "$job_result"
            fi
            ;;
        "tests")
            if [ "$job_result" = "success" ] && [ -n "$metrics" ]; then
                IFS='|' read -r passed failed coverage <<< "$metrics"
                if [ "$coverage" != "N/A" ]; then
                    echo "✅ Success\\n📊 Coverage: $coverage"
                else
                    echo "✅ Success"
                fi
            else
                build_field_value "$job_result"
            fi
            ;;
        *)
            build_field_value "$job_result"
            ;;
    esac
}

# Function to build field value based on job result (fallback)
build_field_value() {
    local job_result="$1"
    local additional_info="$2"
    
    case "$job_result" in
        "success")
            echo "✅ Success${additional_info:+\\n$additional_info}"
            ;;
        "skipped")
            echo "⏭️ Skipped"
            ;;
        "failure")
            echo "❌ Failed"
            ;;
        *)
            echo "❓ Unknown"
            ;;
    esac
}

# Parse detailed metrics from artifacts
echo "📊 Parsing test results and performance metrics..."
E2E_METRICS=$(parse_e2e_results)
PERF_METRICS=$(parse_performance_metrics)
UNIT_METRICS=$(parse_unit_test_results)

echo "🔍 E2E Results: $E2E_METRICS"
echo "⚡ Performance Metrics: $PERF_METRICS"
echo "🧪 Unit Test Metrics: $UNIT_METRICS"

# Get job results from environment variables or use defaults
SETUP_RESULT="${SETUP_RESULT:-success}"
LINT_RESULT="${LINT_RESULT:-success}"
TEST_RESULTS="${TEST_RESULTS:-success}"
PERFORMANCE_RESULTS="${PERFORMANCE_RESULTS:-success}"

STATUS_INFO=$(determine_status "$SETUP_RESULT" "$LINT_RESULT" "$TEST_RESULTS" "$PERFORMANCE_RESULTS")
STATUS=$(echo "$STATUS_INFO" | head -n1)
COLOR=$(echo "$STATUS_INFO" | tail -n1)

# Check Slack configuration
echo "🔍 Checking Slack configuration..."
if [ -n "$SLACK_TOKEN" ]; then
    echo "✅ SLACK_TOKEN is configured"
    # Use same channel as CI workflow
    SLACK_CHANNEL="${SLACK_CHANNEL:-#auro-connect}"
    echo "📤 Sending notification via Slack Bot API to $SLACK_CHANNEL..."
    
    # Create comprehensive message for Slack API
    cat << EOF > slack_api_message.json
{
  "channel": "$SLACK_CHANNEL",
  "text": "$STATUS",
  "attachments": [
    {
      "color": "$COLOR",
      "fields": [
        {
          "title": "📦 Setup & Dependencies",
          "value": "$(build_field_value "$SETUP_RESULT")",
          "short": true
        },
        {
          "title": "🔍 Code Quality & Linting",
          "value": "$(build_field_value "$LINT_RESULT")",
          "short": true
        },
        {
          "title": "🧪 Unit & Integration Tests",
          "value": "$(build_enhanced_field_value "tests" "$TEST_RESULTS" "$UNIT_METRICS")",
          "short": true
        },
        {
          "title": "🎭 End-to-End Tests",
          "value": "$(build_enhanced_field_value "e2e" "$PERFORMANCE_RESULTS" "$E2E_METRICS")",
          "short": true
        },
        {
          "title": "⚡ Performance & Lighthouse",
          "value": "$(build_enhanced_field_value "performance" "$PERFORMANCE_RESULTS" "$PERF_METRICS")",
          "short": false
        }
      ],
      "footer": "GitHub Actions CI/CD",
      "footer_icon": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
      "ts": $(date +%s)
    },
    {
      "color": "$COLOR",
      "fields": [
        {
          "title": "📝 Details",
          "value": "• **Commit:** \`$GITHUB_SHA\`\\n• **Branch:** \`$GITHUB_REF_NAME\`\\n• **Author:** $GITHUB_ACTOR\\n• **Workflow:** <$GITHUB_SERVER_URL/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID|View Details>",
          "short": false
        }
      ]
    }
  ]
}
EOF
    
    curl -X POST -H "Authorization: Bearer $SLACK_TOKEN" \
         -H 'Content-type: application/json' \
         --data @slack_api_message.json \
         "https://slack.com/api/chat.postMessage"
    echo "✅ Bot API notification sent to $SLACK_CHANNEL"
    
elif [ -n "$SLACK_WEBHOOK_URL" ]; then
    echo "📤 Sending notification via webhook (fallback)..."
    
    # Create webhook message
    cat << EOF > slack_webhook_message.json
{
  "text": "$STATUS",
  "attachments": [
    {
      "color": "$COLOR",
      "fields": [
        {
          "title": "📦 Setup & Dependencies",
          "value": "$(build_field_value "$SETUP_RESULT")",
          "short": true
        },
        {
          "title": "🔍 Code Quality & Linting",
          "value": "$(build_field_value "$LINT_RESULT")",
          "short": true
        },
        {
          "title": "🧪 Unit & Integration Tests",
          "value": "$(build_enhanced_field_value "tests" "$TEST_RESULTS" "$UNIT_METRICS")",
          "short": true
        },
        {
          "title": "🎭 End-to-End Tests",
          "value": "$(build_enhanced_field_value "e2e" "$PERFORMANCE_RESULTS" "$E2E_METRICS")",
          "short": true
        },
        {
          "title": "⚡ Performance & Lighthouse",
          "value": "$(build_enhanced_field_value "performance" "$PERFORMANCE_RESULTS" "$PERF_METRICS")",
          "short": false
        }
      ],
      "footer": "GitHub Actions CI/CD",
      "footer_icon": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
      "ts": $(date +%s)
    }
  ]
}
EOF
    
    curl -X POST -H 'Content-type: application/json' \
         --data @slack_webhook_message.json \
         "$SLACK_WEBHOOK_URL"
    echo "✅ Webhook notification sent"
    
else
    echo "⚠️  Neither SLACK_TOKEN nor SLACK_WEBHOOK_URL is set, skipping notification"
    echo "To enable Slack notifications, set one of:"
    echo "  - SLACK_TOKEN: Your Slack bot token (recommended)"
    echo "  - SLACK_WEBHOOK_URL: Your Slack webhook URL (fallback)"
    echo ""
    echo "ℹ️  This is not an error - Slack notifications are optional"
fi

# Cleanup temporary files
rm -f slack_api_message.json slack_webhook_message.json 