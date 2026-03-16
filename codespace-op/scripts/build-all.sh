#!/usr/bin/env bash
set -euo pipefail

# Build all Docker images for Codespace-Op
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Building Codespace-Op Docker Images ==="

echo ">> Building workspace base image..."
docker build -t codespace-op/workspace-base:latest \
  -f "$ROOT_DIR/workspace-images/Dockerfile.base" \
  "$ROOT_DIR/workspace-images"

echo ">> Building workspace Python image..."
docker build -t codespace-op/workspace-python:latest \
  -f "$ROOT_DIR/workspace-images/Dockerfile.python" \
  "$ROOT_DIR/workspace-images"

echo ">> Building workspace Node.js image..."
docker build -t codespace-op/workspace-node:latest \
  -f "$ROOT_DIR/workspace-images/Dockerfile.node" \
  "$ROOT_DIR/workspace-images"

echo ">> Building backend image..."
docker build -t codespace-op/backend:latest \
  -f "$ROOT_DIR/backend/Dockerfile" \
  "$ROOT_DIR/backend"

echo ">> Building frontend image..."
docker build -t codespace-op/frontend:latest \
  -f "$ROOT_DIR/frontend/Dockerfile" \
  "$ROOT_DIR/frontend"

echo "=== All images built successfully ==="
docker images | grep codespace-op
