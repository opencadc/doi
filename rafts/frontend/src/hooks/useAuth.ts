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

'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useMemo } from 'react'

// Define role types to ensure type safety
export type UserRole = 'admin' | 'reviewer' | 'contributor' | 'user' | string

// Define permissions as an object for future extensibility
export type Permissions = {
  canCreateRaft: boolean
  canEditRaft: boolean
  canReviewRaft: boolean
  canApproveRaft: boolean
  canManageUsers: boolean
}

interface UseAuthReturn {
  // Session status
  isLoading: boolean
  isAuthenticated: boolean

  // User info
  user: {
    id?: string
    name?: string | null
    email?: string | null
    role?: string
    affiliation?: string
  } | null

  // Token
  accessToken?: string

  // Role utilities
  role?: string
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  hasAllRoles: (roles: UserRole[]) => boolean

  // Permission utilities
  permissions: Permissions
  hasPermission: (permission: keyof Permissions) => boolean
}

/**
 * Hook for accessing authentication state and role-based utilities
 */
export const useAuth = (): UseAuthReturn => {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'

  // Role checking utility functions
  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!session?.user?.role) return false

      const userRole = session.user.role

      if (Array.isArray(role)) {
        return role.includes(userRole as UserRole)
      }

      return userRole === role
    },
    [session?.user],
  )

  const hasAnyRole = useCallback(
    (roles: UserRole[]): boolean => {
      if (!session?.user?.role) return false
      return roles.some((role) => session.user!.role === role)
    },
    [session?.user],
  )

  const hasAllRoles = useCallback(
    (roles: UserRole[]): boolean => {
      if (!session?.user?.role) return false
      return roles.every((role) => session.user!.role === role)
    },
    [session?.user],
  )

  // Calculate permissions based on the user's role
  const permissions = useMemo((): Permissions => {
    const role = session?.user?.role

    // Default permissions - no access
    const defaultPermissions: Permissions = {
      canCreateRaft: false,
      canEditRaft: false,
      canReviewRaft: false,
      canApproveRaft: false,
      canManageUsers: false,
    }

    // If no role or not authenticated, return default permissions
    if (!role || !isAuthenticated) return defaultPermissions

    // Role-based permissions mapping
    switch (role) {
      case 'admin':
        return {
          canCreateRaft: true,
          canEditRaft: true,
          canReviewRaft: true,
          canApproveRaft: true,
          canManageUsers: true,
        }
      case 'reviewer':
        return {
          canCreateRaft: true,
          canEditRaft: true,
          canReviewRaft: true,
          canApproveRaft: true,
          canManageUsers: false,
        }
      case 'contributor':
        return {
          canCreateRaft: true,
          canEditRaft: true,
          canReviewRaft: false,
          canApproveRaft: false,
          canManageUsers: false,
        }
      case 'user':
        return {
          canCreateRaft: false,
          canEditRaft: false,
          canReviewRaft: false,
          canApproveRaft: false,
          canManageUsers: false,
        }
      default:
        return defaultPermissions
    }
  }, [session?.user?.role, isAuthenticated])

  // Permission check utility
  const hasPermission = useCallback(
    (permission: keyof Permissions): boolean => {
      return permissions[permission] === true
    },
    [permissions],
  )

  return {
    isLoading,
    isAuthenticated,
    user: session?.user || null,
    accessToken: session?.accessToken,
    role: session?.user?.role,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    permissions,
    hasPermission,
  }
}
