#!/usr/bin/env bash
set -eu

HEALTH_URL="${SMOKE_TEST_URL:-http://localhost:8000/health}"
BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT

echo "Checking API: $HEALTH_URL"

STATUS=$(curl -sS \
  --max-time 10 \
  -o "$BODY_FILE" \
  -w '%{http_code}' \
  "$HEALTH_URL") || {
    echo "FAIL: API request failed"
    exit 1
  }

cat "$BODY_FILE"
echo
echo "HTTP status: $STATUS"

if [ "$STATUS" != "200" ]; then
  echo "FAIL: Expected HTTP 200"
  exit 1
fi

if ! grep -q '"status":"ok"' "$BODY_FILE"; then
  echo 'FAIL: Expected JSON status "ok"'
  exit 1
fi

echo "PASS: Smoke test succeeded"
