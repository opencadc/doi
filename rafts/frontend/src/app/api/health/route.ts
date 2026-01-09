import { NextResponse } from 'next/server'

/**
 * Health check endpoint for the frontend service
 * Used by Docker health check to determine if the service is healthy
 */
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
}
