#!/usr/bin/env bash
set -euo pipefail

# Send a Slack notification to #qa-testing channel when an example APK build is ready.
#
# Usage: ./scripts/send-slack-notification.sh <github_context_json> <release_url> <assets_json>
#
# Env: SLACK_QA_WEBHOOK_URL (required) - Slack incoming webhook for #qa-testing channel

GITHUB_CONTEXT="${1:-}"
RELEASE_URL="${2:-}"
ASSETS_JSON="${3:-}"

if [[ -z "$GITHUB_CONTEXT" ]]; then
  echo "[ERROR] Missing required argument: github_context_json" >&2
  exit 1
fi

if [[ -z "${SLACK_QA_WEBHOOK_URL:-}" ]]; then
  echo "[ERROR] SLACK_QA_WEBHOOK_URL environment variable not set" >&2
  exit 1
fi

# Extract values from GitHub context
PR_NUMBER=$(echo "$GITHUB_CONTEXT" | jq -r '.event.pull_request.number')
PR_TITLE=$(echo "$GITHUB_CONTEXT" | jq -r '.event.pull_request.title')
PR_URL=$(echo "$GITHUB_CONTEXT" | jq -r '.event.pull_request.html_url')
BRANCH=$(echo "$GITHUB_CONTEXT" | jq -r '.head_ref')
RUN_NUMBER=$(echo "$GITHUB_CONTEXT" | jq -r '.run_number')
AUTHOR=$(echo "$GITHUB_CONTEXT" | jq -r '.event.pull_request.user.login')
COMMIT_SHA=$(echo "$GITHUB_CONTEXT" | jq -r '.event.pull_request.head.sha')
SHORT_SHA="${COMMIT_SHA:0:7}"

# Try to extract download URL from release assets
DOWNLOAD_URL=""
if [[ -n "$ASSETS_JSON" && "$ASSETS_JSON" != "null" ]]; then
  DOWNLOAD_URL=$(echo "$ASSETS_JSON" | jq -r '.[0].browser_download_url // empty' 2>/dev/null || true)
fi

# Build action buttons
ACTION_BUTTONS='[]'
if [[ -n "$DOWNLOAD_URL" ]]; then
  ACTION_BUTTONS=$(jq -n --arg url "$DOWNLOAD_URL" '[{
    type: "button",
    text: { type: "plain_text", text: "Download APK", emoji: true },
    url: $url,
    style: "primary"
  }]')
fi

ACTION_BUTTONS=$(echo "$ACTION_BUTTONS" | jq \
  --arg pr_url "$PR_URL" \
  --arg release_url "$RELEASE_URL" \
  '. + [
    {
      type: "button",
      text: { type: "plain_text", text: "View PR", emoji: true },
      url: $pr_url
    },
    {
      type: "button",
      text: { type: "plain_text", text: "View Release", emoji: true },
      url: $release_url
    }
  ]')

# Build Slack payload
PAYLOAD=$(jq -n \
  --arg pr_number "$PR_NUMBER" \
  --arg pr_title "$PR_TITLE" \
  --arg pr_url "$PR_URL" \
  --arg branch "$BRANCH" \
  --arg run_number "$RUN_NUMBER" \
  --arg author "$AUTHOR" \
  --arg short_sha "$SHORT_SHA" \
  --argjson action_buttons "$ACTION_BUTTONS" \
  '{
    text: ("DateTime Picker example APK for PR #" + $pr_number + " ready"),
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "DateTime Picker - Example APK Ready",
          emoji: true
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: ("*PR:*\n<" + $pr_url + "|#" + $pr_number + " \u2014 " + $pr_title + ">")
          },
          {
            type: "mrkdwn",
            text: ("*Author:*\n" + $author)
          },
          {
            type: "mrkdwn",
            text: ("*Branch:*\n`" + $branch + "`")
          },
          {
            type: "mrkdwn",
            text: ("*Build:*\n#" + $run_number + " (" + $short_sha + ")")
          }
        ]
      },
      {
        type: "actions",
        elements: $action_buttons
      }
    ]
  }')

# Send to Slack
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H 'Content-type: application/json' \
  --data "$PAYLOAD" \
  "$SLACK_QA_WEBHOOK_URL")

if [[ "$HTTP_CODE" == "200" ]]; then
  echo "[SUCCESS] QA notification sent to Slack" >&2
else
  echo "[ERROR] Slack webhook returned HTTP $HTTP_CODE" >&2
  exit 1
fi
