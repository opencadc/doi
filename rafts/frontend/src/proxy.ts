/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

import { auth } from '@/auth/cadc-auth/credentials'
import { parseCADCSSOCookie } from '@/auth/cadc-auth/parseCADCSSOCookie'
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

// Strip locale prefix from pathname (e.g., /en/view/rafts -> /view/rafts)
const stripLocale = (pathname: string): string => {
  const localePattern = /^\/(en|fr)(\/|$)/
  return pathname.replace(localePattern, '/')
}

const proxy = async (request: NextRequest) => {
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
  // Note: Next.js automatically strips basePath in middleware when configured in next.config.ts
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api/')) {
    // For API routes, just return without locale handling
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    response.headers.set('Pragma', 'no-cache')
    return response
  }

  // SSO auto-login: if no session but CADC_SSO cookie is present, bootstrap a session.
  // This runs on ALL pages (public and protected) so the user appears logged in everywhere.
  // Skip paths that would cause loops (login, SSO endpoint itself).
  const isStaleSession = session && (!session.user?.name || session.user.name.includes('undefined'))
  const ssoSkipPaths = ['/login', '/login-required', '/api/auth']
  const shouldSkipSso = ssoSkipPaths.some((p) => pathnameWithoutLocale.startsWith(p))

  if ((!session || isStaleSession) && !shouldSkipSso) {
    const cadcSso = request.cookies.get('CADC_SSO')?.value
    const ssoToken = cadcSso ? parseCADCSSOCookie(cadcSso) : null

    if (cadcSso && ssoToken) {
      const returnPath = request.nextUrl.pathname || '/'
      const ssoUrl = request.nextUrl.clone()
      ssoUrl.pathname = '/api/auth/sso'
      ssoUrl.searchParams.set('returnUrl', returnPath)
      console.log('[Proxy] SSO redirect for', ssoToken.userID, 'from', returnPath)
      return NextResponse.redirect(ssoUrl)
    }
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

  // Protected path without session — redirect to login
  if (!session || isStaleSession) {
    const returnPath = request.nextUrl.pathname || '/'
    const loginRequiredUrl = request.nextUrl.clone()
    loginRequiredUrl.pathname = '/login-required'
    loginRequiredUrl.searchParams.set('returnUrl', returnPath)
    return NextResponse.redirect(loginRequiredUrl)
  }

  // Check role-based access (use pathname without locale prefix)
  const hasAccess = canAccessRoute(pathnameWithoutLocale, userRole)

  if (!hasAccess) {
    const unauthorizedUrl = request.nextUrl.clone()
    unauthorizedUrl.pathname = '/unauthorized'
    return NextResponse.redirect(unauthorizedUrl)
  }

  // Continue with the locale-handled response
  return response
}

export default proxy

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
