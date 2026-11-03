#!/bin/sh
# Blocks the commit when a staged change holds a secret (betterleaks, rules in .betterleaks.toml).
# Only the staged diff is scanned: old history never blocks a commit.
# False positive: add a `betterleaks:allow` comment on the line, or the path to .betterleaks.toml.
if ! command -v betterleaks >/dev/null 2>&1; then
  echo "❌ betterleaks is not installed: brew install betterleaks" >&2
  exit 1
fi
betterleaks git --pre-commit --staged --redact --no-banner .
