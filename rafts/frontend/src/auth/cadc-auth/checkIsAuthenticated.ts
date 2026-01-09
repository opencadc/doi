'use server'

import { CANFAR_USER_URL } from '@/auth/cadc-auth/constants'

export async function checkIsAuthenticated(req: Request): Promise<{
  isAuthenticated: boolean
  username?: string
}> {
  try {
    // Extract cookies from the request
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = parseCookies(cookieHeader)

    // Look for CADC_SSO cookie
    const cadcCookie = cookies['CADC_SSO']

    if (!cadcCookie) {
      return { isAuthenticated: false }
    }

    // Validate the cookie by making a request to CADC whoami service
    const response = await fetch(CANFAR_USER_URL, {
      headers: {
        Cookie: `CADC_SSO="${cadcCookie}"`,
      },
    })

    if (!response.ok) {
      return { isAuthenticated: false }
    }
    // Parse the user info
    const userInfo = await response.json()

    return {
      isAuthenticated: true,
      username: userInfo.username,
    }
  } catch (error) {
    console.error('Error checking CADC auth:', error)
    return { isAuthenticated: false }
  }
}

// Helper function to parse cookies
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach((cookie) => {
    const [name, value] = cookie.trim().split('=')
    cookies[name] = value
  })

  return cookies
}
