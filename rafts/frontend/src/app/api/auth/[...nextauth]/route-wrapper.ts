import { NextRequest } from 'next/server'
import { GET as AuthGET, POST as AuthPOST } from '@/auth/cadc-auth/credentials'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Wrapper to handle base path issues with NextAuth v5
async function handleRequest(req: NextRequest, handler: (req: NextRequest) => Promise<Response>) {
  // Create a modified request with the base path stripped from the URL
  const url = new URL(req.url)

  // If the pathname includes the base path, strip it for NextAuth
  if (basePath && url.pathname.startsWith(basePath)) {
    url.pathname = url.pathname.slice(basePath.length)
  }

  // Create a new request with the modified URL
  const modifiedReq = new NextRequest(url.toString(), {
    method: req.method,
    headers: req.headers,
    body: req.body,
  })

  // Call the original handler with the modified request
  const response = await handler(modifiedReq)

  return response
}

export async function GET(req: NextRequest) {
  return handleRequest(req, AuthGET)
}

export async function POST(req: NextRequest) {
  return handleRequest(req, AuthPOST)
}
