#!/usr/bin/env bash
set -euo pipefail

# Check for required commands
if ! command -v curl &> /dev/null || ! command -v jq &> /dev/null;
then
  echo "curl and/or jq are not installed" >&2
  exit 1
fi

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

BASE="http://localhost:8080"
API="http://localhost:5000/api"

echo "waiting a little bit"
sleep 10

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

echo "Update User Data"
curl -fsS -X POST "$API/user/update" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test User","phone":"123456789"}' | jq .


echo "Analyze (TEST_MODE)"
RES=$(curl -fsS -X POST "$API/analyze-essay" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"sss","answer":"ssss"}' | jq -r .result)
if ! echo "$RES" | grep -q "\[TEST_MODE\]"; then
  echo "Analysis result is not in test mode" >&2
  exit 1
fi

echo "Create History"
for i in 1 2 3; do
  curl -fsS -X POST "$API/analyze-essay" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"text\":\"Question $i\",\"answer\":\"Answer $i\"}" >/dev/null
done

echo "Get History Count"
COUNT=$(curl -fsS "$API/history" -H "Authorization: Bearer $TOKEN" | jq '.history | length')
if [ "$COUNT" -lt 3 ]; then
  echo "History is empty" >&2
  exit 1
fi
echo "Deleting one history item..."
ITEM_ID=$(curl -fsS "$API/history" -H "Authorization: Bearer $TOKEN" | jq -r '.history[0].id')
curl -fsS -X DELETE "$API/history/$ITEM_ID" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "Cleaning up all history..."
curl -fsS -X DELETE "$API/history" -H "Authorization: Bearer $TOKEN" >/dev/null

echo "Cleaning up user from db..."
USER=$(curl -s "$SUPABASE_URL/auth/v1/admin/users?email=$EMAIL" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")

USER_ID=$(echo "$USER" | jq -r '.users[0].id')

echo "Deleting user: $EMAIL ($USER_ID)"
curl -s -X DELETE "$SUPABASE_URL/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" >/dev/null

echo "OK"
