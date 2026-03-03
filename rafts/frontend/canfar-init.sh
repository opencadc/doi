#!/bin/sh
# This initialization script runs at container startup

# Set up environment variables needed for Next.js
export NEXT_PUBLIC_BASE_PATH="/sessions/contrib"
export NEXTAUTH_URL="https://ws-uv.canfar.net/sessions/contrib"

# Log initialization
echo "CANFAR container initialization complete"

# For testing outside of CANFAR, we need to keep the container running
# When run by CANFAR, this script exits and control goes to CANFAR's process
if [ "$RUNNING_IN_CANFAR" != "true" ]; then
  # Start Next.js in the background and capture its PID
  cd /app/packages/frontend
  npm run start &
  NEXT_PID=$!

  # Log the PID for debugging
  echo "Next.js started with PID: $NEXT_PID"

  # Wait for the Next.js process
  wait $NEXT_PID
else
  # Just exit and let CANFAR take over
  exit 0
fi