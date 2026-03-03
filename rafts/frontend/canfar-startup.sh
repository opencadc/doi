#!/bin/sh
# This script is called by CANFAR with the sessionid as a parameter

# Store the session ID
SESSION_ID=$1
echo "Starting with session ID: $SESSION_ID"

# Set environment variable to indicate we're running in CANFAR
export RUNNING_IN_CANFAR="true"

# Set any session-specific configuration
export NEXTAUTH_URL="https://ws-uv.canfar.net/sessions/contrib/${SESSION_ID}"

# Change to the application directory
cd /app/packages/frontend

# Modify Next.js to run on port 5000
export PORT=5000

# Optionally log some diagnostic info
echo "Starting Next.js application in CANFAR environment"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "PORT: $PORT"
echo "NEXTAUTH_URL: $NEXTAUTH_URL"

# Start the Next.js application in the foreground
exec npm run start