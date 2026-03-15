#!/usr/bin/env bash
set -euo pipefail

# CI Watch Script
# Polls GitHub Actions until all jobs complete
# Exit codes:
#   0 - Success (all jobs passed)
#   1 - Code error (legitimate failure requiring fixes)
#   2 - Timeout
#   3 - Transient error (infrastructure issue, should retry)
#
# Environment variables:
#   CI_WATCH_EXCLUDED_JOBS - Comma-separated list of job patterns to exclude
#   CI_WATCH_WORKFLOW - Workflow name to filter by (default: all workflows)
#   CI_WATCH_INITIAL_DELAY - Seconds to wait before polling for workflow (default: 10)
#   SKIP_CI_WATCH - Set to any non-empty value to skip CI watching

print_info() { printf "\033[0;34m[INFO]\033[0m %s\n" "$1"; }
print_success() { printf "\033[0;32m[SUCCESS]\033[0m %s\n" "$1"; }
print_warning() { printf "\033[1;33m[WARNING]\033[0m %s\n" "$1"; }
print_error() { printf "\033[0;31m[ERROR]\033[0m %s\n" "$1"; }

if [[ -n "${SKIP_CI_WATCH:-}" ]]; then
  print_info "SKIP_CI_WATCH is set, skipping CI monitoring"
  exit 0
fi

if ! command -v gh &>/dev/null; then
  print_error "GitHub CLI (gh) is required but not installed"
  echo "Install it from: https://cli.github.com/"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  print_error "GitHub CLI is not authenticated"
  echo "Run 'gh auth login' to authenticate"
  exit 1
fi

readonly POLL_INTERVAL=15
readonly TIMEOUT_SECONDS=600
readonly EXCLUDED_JOBS="${CI_WATCH_EXCLUDED_JOBS:-}"
readonly WORKFLOW_NAME="${CI_WATCH_WORKFLOW:-}"
readonly INITIAL_DELAY="${CI_WATCH_INITIAL_DELAY:-10}"
readonly MAX_RUN_DETECTION_ATTEMPTS=10
readonly RUN_DETECTION_INTERVAL=3
readonly MAX_NO_JOBS_ATTEMPTS=5

hash_cmd() {
  if command -v shasum &>/dev/null; then
    shasum
  else
    sha1sum
  fi
}

LOCK_FILE="${TMPDIR:-/tmp}/ci-watch-$(git rev-parse --show-toplevel 2>/dev/null | hash_cmd | cut -d' ' -f1).lock"
readonly LOCK_FILE

API_ERROR_TMPFILE=""
LOCK_TYPE=""

cleanup() {
  if [[ "$LOCK_TYPE" == "mkdir" ]]; then
    rm -rf "${LOCK_FILE}.d"
  else
    rm -f "$LOCK_FILE"
  fi
  [[ -n "$API_ERROR_TMPFILE" ]] && rm -f "$API_ERROR_TMPFILE"
  return 0
}

acquire_lock() {
  if command -v flock &>/dev/null; then
    exec 200>"$LOCK_FILE"
    if ! flock -n 200; then
      print_warning "Another CI watch process is already running"
      exit 0
    fi
    echo $$ >&200
    LOCK_TYPE="flock"
    trap cleanup EXIT INT TERM
    return 0
  fi

  local lock_dir="${LOCK_FILE}.d"
  local pid_file="$lock_dir/pid"
  if ! mkdir "$lock_dir" 2>/dev/null; then
    local pid
    pid=$(cat "$pid_file" 2>/dev/null || echo "")
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      print_warning "Another CI watch process is already running (PID: $pid)"
      exit 0
    fi
    rm -rf "$lock_dir"
    if ! mkdir "$lock_dir" 2>/dev/null; then
      print_warning "Failed to acquire lock, another process may have started"
      exit 0
    fi
  fi
  echo $$ > "$pid_file"
  LOCK_TYPE="mkdir"
  trap cleanup EXIT INT TERM
}

get_current_branch() {
  local branch
  branch=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$branch" == "HEAD" ]]; then
    print_error "Cannot watch CI in detached HEAD state"
    exit 1
  fi
  echo "$branch"
}

get_current_sha() {
  git rev-parse HEAD
}

get_run_id_for_sha() {
  local branch="$1"
  local expected_sha="$2"
  local workflow_args=()
  if [[ -n "$WORKFLOW_NAME" ]]; then
    workflow_args=(--workflow "$WORKFLOW_NAME")
  fi
  gh run list --branch "$branch" ${workflow_args[@]+"${workflow_args[@]}"} --limit 5 --json databaseId,headSha \
    --jq "[.[] | select(.headSha == \"$expected_sha\") | .databaseId][0] // empty"
}

get_job_statuses() {
  local run_id="$1"
  local output exit_code
  API_ERROR_TMPFILE=$(mktemp)
  output=$(gh run view "$run_id" --json jobs --jq '.jobs[] | "\(.name)\t\(.status)\t\(.conclusion // "null")"' 2>"$API_ERROR_TMPFILE") && exit_code=0 || exit_code=$?
  if [[ $exit_code -ne 0 ]]; then
    local err_msg
    err_msg=$(cat "$API_ERROR_TMPFILE")
    rm -f "$API_ERROR_TMPFILE"
    API_ERROR_TMPFILE=""
    if [[ -n "$err_msg" ]]; then
      print_warning "GitHub API error (will retry): $err_msg" >&2
    fi
    echo ""
    return 0
  fi
  rm -f "$API_ERROR_TMPFILE"
  API_ERROR_TMPFILE=""
  echo "$output"
}

is_excluded_job() {
  local job_name="$1"
  [[ -z "$EXCLUDED_JOBS" ]] && return 1
  local excluded
  IFS=',' read -ra excluded <<< "$EXCLUDED_JOBS"
  for pattern in "${excluded[@]}"; do
    if [[ "$job_name" == *"$pattern"* ]]; then
      return 0
    fi
  done
  return 1
}

readonly TRANSIENT_ERROR_PATTERNS=(
  "rate limit"
  "exceeded"
  "ETIMEDOUT"
  "ECONNRESET"
  "ENOTFOUND"
  "socket hang up"
  "network error"
  "connection reset"
  "503 Service Unavailable"
  "502 Bad Gateway"
  "504 Gateway Timeout"
  "npm ERR! network"
  "npm ERR! fetch failed"
  "failed to download"
)

is_transient_error() {
  local logs="$1"
  local pattern
  for pattern in "${TRANSIENT_ERROR_PATTERNS[@]}"; do
    if echo "$logs" | grep -qi "$pattern"; then
      return 0
    fi
  done
  return 1
}

wait_for_run() {
  local branch="$1"
  local expected_sha="$2"
  local attempt=1

  print_info "Waiting for workflow run for commit ${expected_sha:0:7}..." >&2

  if [[ "$INITIAL_DELAY" -gt 0 ]]; then
    print_info "Waiting ${INITIAL_DELAY}s for GitHub to register workflow..." >&2
    sleep "$INITIAL_DELAY"
  fi

  while [[ $attempt -le $MAX_RUN_DETECTION_ATTEMPTS ]]; do
    local run_id
    run_id=$(get_run_id_for_sha "$branch" "$expected_sha")

    if [[ -n "$run_id" ]]; then
      echo "$run_id"
      return 0
    fi

    local wait_time=$((RUN_DETECTION_INTERVAL + (attempt - 1) * 2))
    print_info "Attempt $attempt/$MAX_RUN_DETECTION_ATTEMPTS: workflow not found yet (retry in ${wait_time}s)..." >&2
    sleep "$wait_time"
    attempt=$((attempt + 1))
  done

  return 1
}

main() {
  acquire_lock

  local branch current_sha
  branch="${PUSHED_BRANCH:-$(get_current_branch)}"
  current_sha="${PUSHED_SHA:-$(get_current_sha)}"

  if [[ ! "$current_sha" =~ ^[0-9a-f]{40}$ ]]; then
    print_error "Invalid commit SHA format: $current_sha"
    print_info "Expected 40 hexadecimal characters"
    exit 1
  fi

  print_info "Watching CI for branch: $branch (commit: ${current_sha:0:7})"

  local run_id
  if ! run_id=$(wait_for_run "$branch" "$current_sha"); then
    print_error "No workflow run found for commit ${current_sha:0:7} after $MAX_RUN_DETECTION_ATTEMPTS attempts"
    print_info "Tip: Check if GitHub Actions workflow was triggered for this commit"
    print_info "     - Verify .github/workflows/ contains a workflow for this branch"
    print_info "     - Check https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
    exit 1
  fi

  print_info "Found workflow run: $run_id"
  print_info "Polling every ${POLL_INTERVAL}s (timeout: ${TIMEOUT_SECONDS}s)..."
  if [[ -n "$WORKFLOW_NAME" ]]; then
    print_info "Workflow filter: $WORKFLOW_NAME"
  fi
  if [[ -n "$EXCLUDED_JOBS" ]]; then
    print_info "Excluded jobs: $EXCLUDED_JOBS"
  fi

  local start_time no_jobs_count
  start_time=$(date +%s)
  no_jobs_count=0

  while true; do
    local current_time elapsed
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))

    if [[ $elapsed -ge $TIMEOUT_SECONDS ]]; then
      print_warning "Timeout after ${TIMEOUT_SECONDS}s"
      exit 2
    fi

    local all_completed=true
    local any_failed=false
    local pending_jobs=()
    local failed_jobs=()
    local job_count=0

    while IFS=$'\t' read -r job_name status conclusion; do
      if is_excluded_job "$job_name"; then
        continue
      fi

      job_count=$((job_count + 1))

      if [[ "$status" != "completed" ]]; then
        all_completed=false
        pending_jobs+=("$job_name")
      elif [[ "$conclusion" != "success" && "$conclusion" != "skipped" ]]; then
        any_failed=true
        failed_jobs+=("$job_name ($conclusion)")
      fi
    done < <(get_job_statuses "$run_id")

    if [[ $job_count -eq 0 ]]; then
      no_jobs_count=$((no_jobs_count + 1))
      if [[ $no_jobs_count -ge $MAX_NO_JOBS_ATTEMPTS ]]; then
        print_error "No jobs found after $MAX_NO_JOBS_ATTEMPTS attempts (jobs may all be excluded or workflow has no jobs)"
        exit 1
      fi
      print_info "No jobs found yet (attempt $no_jobs_count/$MAX_NO_JOBS_ATTEMPTS), waiting..."
      sleep "$POLL_INTERVAL"
      continue
    fi

    no_jobs_count=0

    if [[ "$all_completed" == true ]]; then
      if [[ "$any_failed" == true ]]; then
        print_error "CI failed!"
        echo ""
        print_info "Failed jobs:"
        for job in "${failed_jobs[@]}"; do
          echo "  - $job"
        done
        echo ""

        local failed_logs
        failed_logs=$(gh run view "$run_id" --log-failed 2>&1 || true)
        echo "$failed_logs"
        echo ""

        if is_transient_error "$failed_logs"; then
          print_warning "TRANSIENT ERROR DETECTED - This is an infrastructure issue, not a code problem."
          print_info "ACTION REQUIRED: Retry the CI run with: gh run rerun $run_id --failed"
          exit 3
        else
          print_error "CODE ERROR DETECTED - This is a legitimate failure that needs fixing."
          print_info "ACTION REQUIRED: Fix the issues shown above, then commit and push again."
          exit 1
        fi
      else
        print_success "CI passed!"
        exit 0
      fi
    fi

    local remaining=$((TIMEOUT_SECONDS - elapsed))
    local IFS=', '
    print_info "Waiting for jobs: ${pending_jobs[*]:-none} (${remaining}s remaining)"
    sleep "$POLL_INTERVAL"
  done
}

main "$@"
