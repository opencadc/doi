#!/bin/bash
# Pre-deployment cleanup script for RAFTS application

set -e

echo "Running pre-deployment cleanup..."

NGINX_CONTAINER="cadc-ui-nginx"

# Remove any existing rafts nginx configuration
echo "Removing old nginx configurations..."
docker exec ${NGINX_CONTAINER} rm -f /etc/nginx/sites-enabled/rafts.conf || true

# Clean up old container if exists
echo "Cleaning up old containers..."
docker stop rafts-open 2>/dev/null || true
docker rm rafts-open 2>/dev/null || true

echo "Pre-deployment cleanup completed!"