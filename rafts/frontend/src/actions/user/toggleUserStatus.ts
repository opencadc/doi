'use server'

import { auth } from '@/auth/cadc-auth/credentials'

interface ToggleStatusResponse {
  success: boolean
  error?: string
  message?: string
}

/**
 * Server action to toggle a user's active status (lock/unlock)
 * Requires admin role
 *
 * @param {string} userId - ID of the user to update
 * @param {boolean} isActive - Whether to activate (true) or deactivate (false) the user
 * @returns {Promise<ToggleStatusResponse>}
 */
export const toggleUserStatus = async (
  userId: string,
  isActive: boolean,
): Promise<ToggleStatusResponse> => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken
    const userRoles = session?.user?.role

    // Check if user is authenticated
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }
    const isAdmin = userRoles && userRoles === 'admin'
    // Verify admin role
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized. Admin role required.' }
    }

    // Make the API call to toggle the user status
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RAFT-System/1.0',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isActive }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to ${isActive ? 'activate' : 'deactivate'} user:`, errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()
    return {
      success: true,
      message:
        responseData.message || `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    }
  } catch (error) {
    console.error('Error toggling user status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
