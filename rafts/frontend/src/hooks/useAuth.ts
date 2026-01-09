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
