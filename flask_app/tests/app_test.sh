#!/usr/bin/env bash
set -euo pipefail

# Check for required commands
if ! command -v curl &> /dev/null || ! command -v jq &> /dev/null;
then
  echo "curl and/or jq are not installed" >&2
  exit 1
fi

BASE="http://localhost:8080"
API="http://0.0.0.0:5000/api"

echo "Waiting for services..."
timeout=60
while ! curl -fsS "$BASE/index.html" >/dev/null 2>&1; do
  timeout=$((timeout - 1))
  if [ $timeout -le 0 ]; then
    echo "Services did not start in time" >&2
    exit 1
  fi
  sleep 1
done

EMAIL="user$RANDOM@example.com"
PASS="pass1234"

echo "Signup"
curl -fsS -X POST "$API/signup" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" || true

echo "Signin"
TOKEN=$(curl -fsS -X POST "$API/signin" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | jq -r .token)
if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get token" >&2
  exit 1
fi

echo "Verify"
if ! curl -fsS -X POST "$API/verify-token" -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\"}" | jq -e '.valid == true' >/dev/null; then
  echo "Token verification failed" >&2
  exit 1
fi

echo "Analyze (TEST_MODE)"
RES=$(curl -fsS -X POST "$API/analyze-essay" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"sss","answer":"ssss"}' | jq -r .result)
if ! echo "$RES" | grep -q "\[TEST_MODE\]"; then
  echo "Analysis result is not in test mode" >&2
  exit 1
fi

echo "History"
COUNT=$(curl -fsS "$API/history" -H "Authorization: Bearer $TOKEN" | jq '.history | length')
if [ "$COUNT" -lt 1 ]; then
  echo "History is empty" >&2
  exit 1
fi

echo "Cleaning up history..."
curl -fsS -X DELETE "$API/history" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "OK"
