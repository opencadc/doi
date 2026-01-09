import { auth } from '@/auth/cadc-auth/credentials'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { routing } from '@/i18n/routing'

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware(routing)

// Define routes and their allowed roles
const routePermissions = {
  '/form/create': ['contributor', 'reviewer', 'admin'],
  '/review': ['reviewer', 'admin'],
  '/admin': ['admin'],
}

// Check if a user with the given role can access a specific path
const canAccessRoute = (path: string, role?: string): boolean => {
  // Check each route pattern
  for (const [route, allowedRoles] of Object.entries(routePermissions)) {
    if (path.startsWith(route)) {
      return role ? allowedRoles.includes(role) : false
    }
  }

  // If no specific restrictions found, allow access by default
  return true
}

// Strip locale prefix from pathname (e.g., /en/view/doi -> /view/doi)
const stripLocale = (pathname: string): string => {
  const localePattern = /^\/(en|fr)(\/|$)/
  return pathname.replace(localePattern, '/')
}

const middleware = async (request: NextRequest) => {
  const publicPaths = ['/login', '/login-required', '/api/auth', '/unauthorized', '/public-view']
  const pathnameWithoutLocale = stripLocale(request.nextUrl.pathname)

  // Check if it's a public path (or the home page)
  const isPublicPath =
    pathnameWithoutLocale === '/' ||
    publicPaths.some((path) => pathnameWithoutLocale.startsWith(path))

  // Get session
  const session = await auth()
  const userRole = session?.user?.role

  // Skip locale handling for API routes
  const pathname = request.nextUrl.pathname
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const pathWithoutBase = pathname.replace(basePath, '')

  if (pathWithoutBase.startsWith('/api/')) {
    // For API routes, just return without locale handling
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    return response
  }

  // Handle locale for non-API routes
  const response = await intlMiddleware(request)

  // Set cache control headers to prevent caching of authenticated pages
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  response.headers.set('Pragma', 'no-cache')

  // If it's a public path, just handle the locale
  if (isPublicPath) {
    return response
  }

  // If not authenticated (no session), redirect to login-required page
  if (!session) {
    const loginRequiredUrl = new URL('/login-required', request.url)
    // Preserve the current path as returnUrl - strip basePath to avoid double prepending
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
    const returnPath = request.nextUrl.pathname.replace(basePath, '') || '/'
    loginRequiredUrl.searchParams.set('returnUrl', returnPath)
    return NextResponse.redirect(loginRequiredUrl)
  }

  // Check role-based access
  const hasAccess = canAccessRoute(request.nextUrl.pathname, userRole)

  if (!hasAccess) {
    return NextResponse.redirect(new URL('/unauthorized', request.url))
  }

  // Continue with the locale-handled response
  return response
}

export default middleware

// Fix 5: Make matcher basePath-aware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
