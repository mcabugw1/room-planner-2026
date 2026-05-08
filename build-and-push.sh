#!/bin/sh
set -e

IMAGE="akoha/room-planner:latest"

echo "Building $IMAGE for linux/amd64..."
docker buildx build --platform linux/amd64 -t "$IMAGE" --push .

echo "Done. Pull on Unraid with:"
echo "  docker pull $IMAGE"
