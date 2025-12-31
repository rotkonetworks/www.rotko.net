#!/bin/bash
# Build and optionally push the www.rotko.net container
set -e

IMAGE_NAME="www-rotko-net"
REGISTRY="${REGISTRY:-}"

# Build the site first if dist is outdated
if [ -f package.json ]; then
    if [ ! -d dist ] || [ "$(find src -newer dist -print -quit 2>/dev/null)" ]; then
        echo "Building site..."
        bun run build
    fi
fi

# Build container
echo "Building container..."
podman build -t "$IMAGE_NAME" .

echo "Image size:"
podman images "$IMAGE_NAME" --format "{{.Size}}"

# Push if registry specified
if [ -n "$REGISTRY" ]; then
    echo "Pushing to $REGISTRY..."
    podman tag "$IMAGE_NAME" "$REGISTRY/$IMAGE_NAME"
    podman push "$REGISTRY/$IMAGE_NAME"
fi

echo "Done! Run with: podman run -p 8080:80 $IMAGE_NAME"
