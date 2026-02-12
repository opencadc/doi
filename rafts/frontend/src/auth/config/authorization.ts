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

export type UserRole = 'contributor' | 'reviewer' | 'admin' | undefined

interface RouteConfig {
  path: string
  roles: UserRole[]
  title: string
  description?: string
  icon?: string // Optional icon identifier
  children?: Record<string, RouteConfig> // For nested routes
  isPublic?: boolean // For routes that don't require authentication
}

export const routes: Record<string, RouteConfig> = {
  // Public routes
  login: {
    path: '/login',
    roles: [],
    title: 'Login',
    isPublic: true,
  },

  // Dashboard
  home: {
    path: '/',
    roles: ['contributor', 'reviewer', 'admin'],
    title: 'Dashboard',
    description: 'Overview of RAFT activities',
  },

  // RAFT Creation
  createRaft: {
    path: '/form/create',
    roles: ['contributor', 'reviewer', 'admin'],
    title: 'Create RAFT',
    description: 'Submit a new research announcement',
  },

  // View RAFTs (all users)
  viewRafts: {
    path: '/view',
    roles: ['contributor', 'reviewer', 'admin'],
    title: 'View RAFTs',
    description: 'Browse published announcements',
  },

  // Review System (reviewers and admins only)
  review: {
    path: '/review',
    roles: ['reviewer', 'admin'],
    title: 'Review RAFTs',
    description: 'Review and moderate submitted RAFTs',
    children: {
      pending: {
        path: '/review/pending',
        roles: ['reviewer', 'admin'],
        title: 'Pending Review',
        description: 'RAFTs awaiting initial review',
      },
      inProgress: {
        path: '/review/in-progress',
        roles: ['reviewer', 'admin'],
        title: 'In Progress',
        description: 'RAFTs currently being reviewed',
      },
      approved: {
        path: '/review/approved',
        roles: ['reviewer', 'admin'],
        title: 'Approved',
        description: 'RAFTs that have been approved',
      },
      rejected: {
        path: '/review/rejected',
        roles: ['reviewer', 'admin'],
        title: 'Rejected',
        description: 'RAFTs that have been rejected',
      },
      raftDetail: {
        path: '/review/rafts/:id',
        roles: ['reviewer', 'admin'],
        title: 'RAFT Details',
        description: 'Detailed view of a RAFT submission',
      },
    },
  },

  // Admin Panel (admin only)
  admin: {
    path: '/admin',
    roles: ['admin'],
    title: 'Admin Panel',
    description: 'System administration',
    children: {
      users: {
        path: '/admin/users',
        roles: ['admin'],
        title: 'User Management',
        description: 'Manage system users',
      },
      settings: {
        path: '/admin/settings',
        roles: ['admin'],
        title: 'System Settings',
        description: 'Configure system settings',
      },
      statistics: {
        path: '/admin/statistics',
        roles: ['admin'],
        title: 'Statistics',
        description: 'System usage statistics',
      },
    },
  },

  // User Profile (all authenticated users)
  profile: {
    path: '/profile',
    roles: ['contributor', 'reviewer', 'admin'],
    title: 'My Profile',
    description: 'View and update your profile',
  },

  // Fallback Routes
  unauthorized: {
    path: '/unauthorized',
    roles: [],
    title: 'Unauthorized',
    isPublic: true,
  },
  notFound: {
    path: '/not-found',
    roles: [],
    title: 'Not Found',
    isPublic: true,
  },
}

// Helper functions for route access

/**
 * Check if a user with the given role can access a specific route
 */
export const canAccessRoute = (path: string, role?: UserRole): boolean => {
  if (!role) {
    // Only allow access to public routes when no role is provided
    return getRouteByPath(path)?.isPublic || false
  }

  const route = getRouteByPath(path)

  // If route doesn't exist in config, deny access
  if (!route) return false

  // If it's a public route, allow access
  if (route.isPublic) return true

  // Check if the user's role is in the list of allowed roles
  return route.roles.includes(role)
}

/**
 * Find a route configuration by path
 */
export const getRouteByPath = (path: string): RouteConfig | undefined => {
  // Handle dynamic routes by replacing route parameters
  const normalizedPath = path.replace(/\/[^/]+$/, '/:id')

  // First check top-level routes
  const topLevelRoute = Object.values(routes).find(
    (route) => route.path === path || route.path === normalizedPath,
  )
  if (topLevelRoute) return topLevelRoute

  // Then check children routes
  for (const parentRoute of Object.values(routes)) {
    if (!parentRoute.children) continue

    const childRoute = Object.values(parentRoute.children).find(
      (route) => route.path === path || route.path === normalizedPath,
    )

    if (childRoute) return childRoute
  }

  return undefined
}

/**
 * Get all routes accessible to a specific role
 */
export const getAccessibleRoutes = (role?: UserRole): RouteConfig[] => {
  if (!role) {
    return Object.values(routes).filter((route) => route.isPublic)
  }

  return Object.values(routes).filter((route) => route.isPublic || route.roles.includes(role))
}

/**
 * Get all menu items that should be displayed for a specific role
 * (excludes utility routes like unauthorized, notFound, etc.)
 */
export const getNavigationRoutes = (role?: UserRole): RouteConfig[] => {
  const accessibleRoutes = getAccessibleRoutes(role)

  // Filter out utility routes and routes that might not be suitable for the main navigation
  return accessibleRoutes.filter(
    (route) =>
      !route.isPublic &&
      route.path !== '/unauthorized' &&
      route.path !== '/not-found' &&
      !route.path.includes('/:'), // Exclude dynamic routes from main navigation
  )
}
