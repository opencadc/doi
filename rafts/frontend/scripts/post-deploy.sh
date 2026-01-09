#!/bin/bash
# Post-deployment script for RAFTS application
# Handles nginx configuration for rafts.testapp.ca subdomain

set -e

echo "Starting post-deployment configuration for RAFTS..."

# Define paths
RAFTS_NGINX_CONFIG="/home/deploy/rafts-open/nginx/rafts-subdomain.conf"
NGINX_CONTAINER="cadc-ui-nginx"

# Check if nginx config exists
if [ ! -f "$RAFTS_NGINX_CONFIG" ]; then
    echo "Error: Nginx config not found at $RAFTS_NGINX_CONFIG"
    exit 1
fi

# Copy nginx configuration to sites-enabled in the container
echo "Deploying nginx configuration for rafts.testapp.ca..."
docker cp "$RAFTS_NGINX_CONFIG" ${NGINX_CONTAINER}:/etc/nginx/sites-enabled/rafts.conf

# Test nginx configuration
echo "Testing nginx configuration..."
if docker exec ${NGINX_CONTAINER} nginx -t; then
    echo "Nginx configuration is valid"
    
    # Reload nginx to pick up the new configuration
    echo "Reloading nginx..."
    docker exec ${NGINX_CONTAINER} nginx -s reload
    echo "Nginx configuration reloaded successfully"
else
    echo "Error: Invalid nginx configuration"
    # Remove the problematic config
    docker exec ${NGINX_CONTAINER} rm -f /etc/nginx/sites-enabled/rafts.conf
    docker exec ${NGINX_CONTAINER} nginx -t
    exit 1
fi

echo "RAFTS application deployed successfully!"
echo "Access the application at: https://rafts.testapp.ca"

# Additional post-deployment tasks can be added here
# For example:
# - Health check
# - Warm up cache
# - Send notification

echo "Post-deployment configuration completed successfully!"