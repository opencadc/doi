import { NextRequest } from 'next/server'
import { GET as AuthGET, POST as AuthPOST } from '@/auth/cadc-auth/credentials'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

// Fix the URL path for NextAuth v5 which doesn't handle base paths well
function fixUrl(req: NextRequest): NextRequest {
  if (!basePath) return req

  const url = new URL(req.url)
  // Remove the base path from the pathname for NextAuth processing
  if (url.pathname.startsWith(`${basePath}/api/auth`)) {
    url.pathname = url.pathname.replace(basePath, '')
  }

  return new NextRequest(url, req)
}

export async function GET(req: NextRequest) {
  const fixedReq = fixUrl(req)
  return AuthGET(fixedReq)
}

export async function POST(req: NextRequest) {
  const fixedReq = fixUrl(req)
  return AuthPOST(fixedReq)
}
