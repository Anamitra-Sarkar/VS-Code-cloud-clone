#!/usr/bin/env bash
set -euo pipefail

# Trigger a workspace snapshot via the Codespace-Op API
# Usage: ./snapshot.sh <workspace_id> [api_url]

WORKSPACE_ID="${1:?Usage: snapshot.sh <workspace_id> [api_url]}"
API_URL="${2:-http://localhost:7860}"
TOKEN="${CODESPACE_OP_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: CODESPACE_OP_TOKEN environment variable is required"
  exit 1
fi

echo "Triggering snapshot for workspace: ${WORKSPACE_ID}"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${API_URL}/api/workspaces/${WORKSPACE_ID}/snapshot" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "Snapshot created successfully"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "Error: Snapshot failed with HTTP ${HTTP_CODE}"
  echo "$BODY"
  exit 1
fi
