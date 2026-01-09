// src/app/api/setup-cookies/route.ts
import { NextResponse } from 'next/server'
import { CADC_COOKIE_DOMAIN_URL, CANFAR_COOKIE_DOMAIN_URL } from '@/auth/cadc-auth/constants'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 400 })
  }

  // Forward the requests and capture responses
  const canfarRes = await fetch(`${CANFAR_COOKIE_DOMAIN_URL}${token}`, {
    credentials: 'include',
    redirect: 'manual',
  })
  const cadcRes = await fetch(`${CADC_COOKIE_DOMAIN_URL}${token}`, {
    credentials: 'include',
    redirect: 'manual',
  })

  // Extract cookie headers
  const canfarCookies = canfarRes.headers.getSetCookie()
  const cadcCookies = cadcRes.headers.getSetCookie()

  // Create response with combined cookies
  const response = NextResponse.json({ success: true })

  const extractCookieValue = (cookieHeader: string) => {
    const matches = cookieHeader.match(/CADC_SSO="([^"]+)"/)
    return matches ? matches[1] : null
  }

  /*const extractCookieAttribute = (cookieHeader: string, attribute: string): string | undefined => {
    const regex = new RegExp(`${attribute}=([^;]+)`, 'i')
    const matches = cookieHeader.match(regex)
    return matches ? matches[1] : undefined
  }*/

  // Forward all cookies to the client
  for (const cookieHeader of [...canfarCookies, ...cadcCookies]) {
    const cookieValue = extractCookieValue(cookieHeader)
    if (cookieValue) {
      // Create a new cookie with the same value but set the domain to your app's domain

      response.cookies.set({
        name: 'CADC_SSO',
        value: cookieValue,
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        path: '/',
        maxAge: 169344,
      })
    }
  }

  return response
}
