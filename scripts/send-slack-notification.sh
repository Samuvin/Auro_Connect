#!/bin/bash

# Slack Notification Script
# Handles Slack message generation and sending for CI/CD pipeline results

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

# Function to build field value based on job result
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
          "title": "🧪 Tests",
          "value": "$(build_field_value "$TEST_RESULTS")",
          "short": true
        },
        {
          "title": "⚡ Performance",
          "value": "$(build_field_value "$PERFORMANCE_RESULTS")",
          "short": true
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
          "title": "🧪 Tests",
          "value": "$(build_field_value "$TEST_RESULTS")",
          "short": true
        },
        {
          "title": "⚡ Performance",
          "value": "$(build_field_value "$PERFORMANCE_RESULTS")",
          "short": true
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