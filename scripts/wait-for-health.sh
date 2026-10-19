#!/usr/bin/env bash
set -eu

HEALTH_URL="${HEALTH_URL:-http://localhost:8000/health}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-15}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"

if ! [[ "$MAX_ATTEMPTS" =~ ^[1-9][0-9]*$ ]]; then
  echo "FAIL: MAX_ATTEMPTS must be a positive integer"
  exit 1
fi

if ! [[ "$SLEEP_SECONDS" =~ ^[1-9][0-9]*$ ]]; then
  echo "FAIL: SLEEP_SECONDS must be a positive integer"
  exit 1
fi

echo "Waiting for API health: $HEALTH_URL"

attempt=1

while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if BODY="$(curl -fsS --max-time 3 "$HEALTH_URL" 2>/dev/null)"; then
    if printf '%s' "$BODY" | grep -q '"status":"ok"'; then
      echo "PASS: API is healthy"
      printf '%s\n' "$BODY"
      exit 0
    fi
  fi

  echo "Attempt $attempt/$MAX_ATTEMPTS: API not ready"
  attempt=$((attempt + 1))

  if [ "$attempt" -le "$MAX_ATTEMPTS" ]; then
    sleep "$SLEEP_SECONDS"
  fi
done

echo "FAIL: API did not become healthy"
exit 1
