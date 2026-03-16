#!/usr/bin/env bash
set -euo pipefail

# Restore a workspace from a snapshot via the Codespace-Op API
# Usage: ./restore.sh <workspace_id> <snapshot_id> [api_url]

WORKSPACE_ID="${1:?Usage: restore.sh <workspace_id> <snapshot_id> [api_url]}"
SNAPSHOT_ID="${2:?Usage: restore.sh <workspace_id> <snapshot_id> [api_url]}"
API_URL="${3:-http://localhost:7860}"
TOKEN="${CODESPACE_OP_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  echo "Error: CODESPACE_OP_TOKEN environment variable is required"
  exit 1
fi

echo "Restoring workspace ${WORKSPACE_ID} from snapshot ${SNAPSHOT_ID}"

RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "${API_URL}/api/workspaces/${WORKSPACE_ID}/restore" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{\"snapshot_id\": \"${SNAPSHOT_ID}\"}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
  echo "Restore completed successfully"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "Error: Restore failed with HTTP ${HTTP_CODE}"
  echo "$BODY"
  exit 1
fi
